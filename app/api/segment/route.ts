import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Normalization function (simplified version)
function normalizeText(text: string): string {
  // This is a simplified normalization function
  // In a real implementation, you might want to include more complex normalization logic
  return text
    .replace(/أ|إ|آ/g, "ا") // Normalize alef variations
    .replace(/ة/g, "ه") // Normalize taa marbouta
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
}

// Word lists - in a real implementation, these would be loaded from files
const PREFIX_LIST = [
  "ت", "ي", "و", "ا", "أ", "ن", "م", "ب", "ل", "ف", "ال", "تت",
  "يت", "فل", "لي", "است", "فال", "تن", "ين", "نت", "بال"
]

const SUFFIX_LIST = [
  "ت", "ي", "ه", "و", "ك", "ة", "ش", "نا", "هم", "كم", "ها",
  "ين", "ات", "ني", "لهم", "لكم", "لنا", "لها", "وا", "ان"
]

// Load words from files
function loadWordsFromFile(filePath: string): Set<string> {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const words = fileContents.split(/\r?\n/).filter(word => word.trim() !== '')
    return new Set(words)
  } catch (error) {
    console.error(`Error loading words from ${filePath}:`, error)
    return new Set()
  }
}

// Load the root words and none words
const rootWordsPath = path.join(process.cwd(), 'app/api/data/root-words/words.txt')
const noneWordsPath = path.join(process.cwd(), 'app/api/data/none-words/words.txt')

let ROOT_WORDS: Set<string>
let NONE_WORDS: Set<string>

try {
  ROOT_WORDS = loadWordsFromFile(rootWordsPath)
  NONE_WORDS = loadWordsFromFile(noneWordsPath)
} catch (error) {
  console.error("Error loading word lists:", error)
  // Fallback to empty sets if files can't be loaded
  ROOT_WORDS = new Set()
  NONE_WORDS = new Set()
}

// Find index of item in array
function findIndex(list: string[], item: string): number {
  return list.indexOf(item)
}

// Get word before current word in sentence
function beforeWord(word: string, line: string[]): string {
  const index = line.indexOf(word)
  return index > 0 ? line[index - 1] : ""
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    const normalizedText = normalizeText(text)
    const { segmentedText, categories } = segment(normalizedText)

    // Optional: save categories to files
    try {
      const categoryDir = path.join(process.cwd(), 'app/api/data/categories')

      // Create directory if it doesn't exist
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true })
      }

      // Save each category to a file
      Object.entries(categories).forEach(([category, words]) => {
        const filePath = path.join(categoryDir, `${category}.txt`)
        fs.writeFileSync(filePath, words.join('\n'), 'utf8')
      })
    } catch (error) {
      console.error("Error saving categories to files:", error)
      // Continue execution even if saving files fails
    }

    return NextResponse.json({ segmentedText })
  } catch (error) {
    console.error("Error processing text:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// Main segmentation function
function segment(text: string): { segmentedText: string, categories: { [key: string]: string[] } } {
  let tstPr = false
  let tstSf = false
  const words = text.split(" ")
  const allWords: string[] = []

  // Category buckets
  const categories = {
    prefix: [] as string[],
    suffix: [] as string[],
    prefixSuffix: [] as string[],
    nothing: [] as string[]
  }

  // Function to handle negation
  function sigNot(word: string): string {
    if (word.startsWith("ما")) {
      const w = word.substring(2, word.length - 1)
      const result = "ما" + "+" + tokenize(w) + "+" + "ش"
      tstSf = true
      tstPr = true
      return result
    } else if (word.startsWith("م") && !word.startsWith("ما")) {
      const w = word.substring(1, word.length - 1)
      const result = "م" + "+" + tokenize(w) + "+" + "ش"
      tstSf = true
      tstPr = true
      return result
    } else {
      const w = word.substring(0, word.length - 1)
      const result = tokenize(w) + "+" + "ش"
      tstSf = true
      return result
    }
  }

  // Main tokenization function
  function tokenize(wordA: string): string {
    let vrb = 1
    let fb = 1
    let taa = 1

    if (!ROOT_WORDS.has(wordA) && !NONE_WORDS.has(wordA)) {
      let t = true
      let tst = ""

      for (let i = 0; i < wordA.length; i++) {
        tst += wordA[i]

        // If the word has just a prefix
        if (PREFIX_LIST.includes(tst) && ROOT_WORDS.has(wordA.substring(tst.length))) {
          t = false
          tstPr = true
          return wordA.substring(0, tst.length) + "+" + wordA.substring(tst.length)
        }
        // If the word has just a suffix
        else if (ROOT_WORDS.has(tst) && SUFFIX_LIST.includes(wordA.substring(tst.length))) {
          t = false
          tstSf = true
          return wordA.substring(0, tst.length) + "+" + wordA.substring(tst.length)
        }
        // If the word has prefix and suffix
        else if (PREFIX_LIST.includes(tst) && !PREFIX_LIST.includes(wordA)) {
          const ha = wordA.substring(tst.length)
          let tst2 = ""
          for (let j = 0; j < ha.length; j++) {
            tst2 += ha[j]
            if (ROOT_WORDS.has(tst2) && SUFFIX_LIST.includes(ha.substring(tst2.length))) {
              t = false
              tstSf = true
              tstPr = true
              return (
                wordA.substring(0, tst.length) +
                "+" +
                wordA.substring(tst.length, tst.length + tst2.length) +
                "+" +
                wordA.substring(tst.length + tst2.length)
              )
            }
          }
        }
      }

      // If we've gone through the entire word and no rule matched
      if (tst === wordA && t === true) {
        const beforeW = beforeWord(wordA, words)

        // Handle negation patterns
        if (
          (wordA.length > 3 && wordA.endsWith("ش") && beforeW === "ما") ||
          (wordA.length > 3 && wordA.endsWith("ش") && wordA.startsWith("م"))
        ) {
          return sigNot(wordA)
        }
        // Handle vocative and negation prefixes
        else if (wordA.length > 3 && (wordA.startsWith("يا") || wordA.startsWith("ما"))) {
          const v = wordA.substring(2)
          tstPr = true
          return wordA.substring(0, 2) + "+" + tokenize(v)
        }
        // Handle complex pronouns with lam
        else if (
          wordA.length > 4 && taa === 1 &&
          (wordA.endsWith("كم") || wordA.endsWith("هم") || wordA.endsWith("نا") || wordA.endsWith("ها")) &&
          wordA[wordA.length - 3] === "ل"
        ) {
          const v = wordA.substring(0, wordA.length - 3)
          tstSf = true
          return tokenize(v) + "+" + wordA.substring(wordA.length - 3)
        }
        // Handle dual/plural/feminine suffixes
        else if (
          wordA.length > 3 && taa === 1 &&
          (wordA.endsWith("كم") || wordA.endsWith("هم") || wordA.endsWith("نا") ||
            wordA.endsWith("ها") || wordA.endsWith("ني") || wordA.endsWith("ان") ||
            wordA.endsWith("ات") || wordA.endsWith("ين"))
        ) {
          const v = wordA.substring(0, wordA.length - 2)
          tstSf = true
          return tokenize(v) + "+" + wordA.substring(wordA.length - 2)
        }
        // Handle "li" suffix
        else if (wordA.length > 3 && taa === 1 && wordA.endsWith("لي")) {
          const v = wordA.substring(0, wordA.length - 2)
          tstSf = true
          return tokenize(v) + "+" + wordA.substring(wordA.length - 2)
        }
        // Handle pronouns with lam prefix
        else if (
          wordA.length > 3 && taa === 1 &&
          (wordA[wordA.length - 1] === "ك" || wordA[wordA.length - 1] === "و" ||
            wordA[wordA.length - 1] === "ه" || wordA[wordA.length - 1] === "ي") &&
          wordA[wordA.length - 2] === "ل"
        ) {
          const h = wordA.substring(0, wordA.length - 2)
          tstSf = true
          return tokenize(h) + "+" + wordA.substring(wordA.length - 2)
        }
        // Handle simple pronouns
        else if (
          wordA.length > 2 && taa === 1 &&
          (wordA[wordA.length - 1] === "ك" || wordA[wordA.length - 1] === "و" ||
            wordA[wordA.length - 1] === "ه" || wordA[wordA.length - 1] === "ي")
        ) {
          const h = wordA.substring(0, wordA.length - 1)
          tstSf = true
          return tokenize(h) + "+" + wordA.substring(wordA.length - 1)
        }
        // Handle "waw" conjunction
        else if (wordA.length > 3 && wordA[0] === "و") {
          const v = wordA.substring(1)
          return wordA[0] + " " + tokenize(v)
        }
        // Handle feminine marker taa marbuta
        else if (wordA.length > 2 && wordA[wordA.length - 1] === "ة") {
          taa++
          tstSf = true
          return tokenize(wordA.substring(0, wordA.length - 1)) + "+" + "ة"
        }
        // Handle verb prefixes
        else if (
          wordA.length > 2 && fb === 1 &&
          (wordA[0] === "ن" || wordA[0] === "ي" || wordA[0] === "ت") &&
          wordA[wordA.length - 1] !== "ة"
        ) {
          const v = wordA.substring(1)
          vrb++
          tstPr = true
          return wordA[0] + "+" + tokenize(v)
        }
        // Handle preposition prefixes
        else if (wordA.length > 2 && vrb === 1 && (wordA[0] === "ب" || wordA[0] === "ف")) {
          fb++
          tstPr = true
          return wordA[0] + "+" + tokenize(wordA.substring(1))
        }
        // Handle double lam
        else if (wordA.length > 3 && wordA.substring(0, 2) === "لل") {
          tstPr = true
          return "ل" + "+" + "ال" + "+" + wordA.substring(2)
        }
        // Handle definite article "al"
        else if (wordA.length > 3 && wordA.substring(0, 2) === "ال") {
          tstPr = true
          return "ال" + "+" + wordA.substring(2)
        }
        // Handle preposition "li"
        else if (wordA.length > 2 && vrb === 1 && wordA[0] === "ل") {
          tstPr = true
          return wordA[0] + "+" + tokenize(wordA.substring(1))
        }
        // Handle taa suffix
        else if (wordA.length > 2 && taa === 1 && wordA[wordA.length - 1] === "ت") {
          tstSf = true
          return tokenize(wordA.substring(0, wordA.length - 1)) + "+" + wordA.substring(wordA.length - 1)
        }
        // Default case - keep word as is
        else {
          return wordA
        }
      }
    } else {
      // Word is in root words or none words lists - keep as is
      return wordA
    }

    // Fallback (should not reach here in normal execution)
    return wordA
  }

  // Process each word
  for (const word of words) {
    const finalWord = tokenize(word)
    allWords.push(finalWord)

    // Categorize word based on flags
    if (tstPr && !tstSf) {
      categories.prefix.push(finalWord)
    } else if (tstSf && !tstPr) {
      categories.suffix.push(finalWord)
    } else if (tstPr && tstSf) {
      categories.prefixSuffix.push(finalWord)
    } else {
      categories.nothing.push(finalWord)
    }

    // Reset flags for next word
    tstPr = false
    tstSf = false
  }

  // Join all words with spaces to display properly in the UI
  return {
    segmentedText: allWords.join(" "),
    categories
  }
}

