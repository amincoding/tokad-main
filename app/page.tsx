"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { ArrowRight, FileText, Loader2, Download, Upload } from "lucide-react"

export default function Home() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Function to process text through the API
  const processText = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/segment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }),
      })

      const data = await response.json()

      if (response.ok) {
        setOutputText(data.segmentedText)
      } else {
        console.error("Error from API:", data.error)
        setOutputText("Error processing text. Please try again.")
      }
    } catch (error) {
      console.error("Error processing text:", error)
      setOutputText("Error processing text. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = async (e) => {
      const fileContent = e.target?.result as string
      setInputText(fileContent)

      try {
        const response = await fetch("/api/segment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: fileContent }),
        })

        const data = await response.json()

        if (response.ok) {
          setOutputText(data.segmentedText)
        } else {
          console.error("Error from API:", data.error)
          setOutputText("Error processing text. Please try again.")
        }
      } catch (error) {
        console.error("Error processing text:", error)
        setOutputText("Error processing text. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setIsLoading(false)
      alert("Error reading file")
    }

    reader.readAsText(file)
  }

  const downloadResult = () => {
    if (!outputText) return

    const element = document.createElement("a")
    const file = new Blob([outputText], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "tokad-segmentation-result.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf6f1] to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tokad-yMAjM2XbscZ8Qp3eUWKkFRTQgXUm11.png"
                alt="TOKAD Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                About
              </a>
              <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                Features
              </a>
              <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                Documentation
              </a>
              <Button className="bg-[#2A9D8F] hover:bg-[#248277] text-white">Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Algerian Dialect
              <span className="text-[#F4A261] block mt-2">Text Segmentation</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
              Advanced AI-powered tool for precise segmentation of Algerian dialect text, designed for researchers and
              language processing applications.
            </p>
          </div>

          {/* Main Input/Output Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-6 shadow-lg bg-white/70 backdrop-blur-sm border-[#2A9D8F]/20">
              <div className="flex items-center mb-4">
                <FileText className="mr-2 h-5 w-5 text-[#2A9D8F]" />
                <h2 className="text-xl font-semibold text-gray-800">Input Text</h2>
              </div>
              <textarea
                className="w-full h-48 p-4 rounded-lg border border-gray-200 focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 resize-none"
                placeholder="Type or paste Algerian dialect text here..."
                dir="auto"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="mt-4 flex justify-between">
                <label className="flex items-center text-sm text-gray-600 cursor-pointer hover:text-[#2A9D8F] transition-colors">
                  <Upload className="h-4 w-4 mr-1" />
                  <span>Upload File</span>
                  <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                </label>
                <button
                  className="text-sm text-gray-600 hover:text-[#2A9D8F] transition-colors"
                  onClick={() => setInputText("")}
                >
                  Clear
                </button>
              </div>
            </Card>

            <Card className="p-6 shadow-lg bg-white/70 backdrop-blur-sm border-[#E76F51]/20">
              <div className="flex items-center mb-4">
                <FileText className="mr-2 h-5 w-5 text-[#E76F51]" />
                <h2 className="text-xl font-semibold text-gray-800">Results</h2>
              </div>
              <div className="h-48 p-4 rounded-lg border border-gray-200 bg-gray-50 overflow-auto" dir="auto">
                {outputText ? (
                  <div className="whitespace-pre-wrap">{outputText}</div>
                ) : (
                  <p className="text-gray-400 italic">Segmented text will appear here...</p>
                )}
              </div>
              {outputText && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#E76F51] border-[#E76F51] hover:bg-[#E76F51]/10"
                    onClick={downloadResult}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Results
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Action Button */}
          <div className="flex justify-center mb-16">
            <Button
              size="lg"
              className="bg-[#F4A261] hover:bg-[#E76F51] text-white px-8 py-6 text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={processText}
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Process Text
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: "Accurate Segmentation",
                description: "State-of-the-art AI model specifically trained for Algerian dialect",
                color: "bg-[#2A9D8F]",
              },
              {
                title: "Fast Processing",
                description: "Real-time text processing with minimal latency",
                color: "bg-[#F4A261]",
              },
              {
                title: "Research Grade",
                description: "Developed and validated by linguistic experts",
                color: "bg-[#E76F51]",
              },
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-lg ${feature.color} mb-4 flex items-center justify-center`}>
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* Citation Section */}
          <Card className="p-6 shadow-lg bg-white mb-16">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-amber-600" />
              Citation
            </h2>
            <div className="p-4 border rounded-md bg-slate-50 text-sm">
              <p className="mb-2 font-medium">When using TOKAD in your research, please cite:</p>
              <div className="bg-white p-3 border rounded shadow-sm font-mono text-xs overflow-x-auto">
                <p>
                  Author, A., Author, B., & Author, C. (2023). TOKAD: A Novel Approach to Text Segmentation for the
                  Algerian Dialect. <em>Journal of Natural Language Processing</em>, 45(2), 112-128.
                </p>
              </div>
              <p className="mt-3 text-slate-600">
                For more information about TOKAD and its implementation, visit our{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  research page
                </a>
                .
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tokad-yMAjM2XbscZ8Qp3eUWKkFRTQgXUm11.png"
                alt="TOKAD Logo"
                width={100}
                height={32}
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-600">Advanced text segmentation for the Algerian dialect.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                    Research
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                    Case Studies
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2A9D8F]">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-gray-600">
            <p>© 2024 TOKAD. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

