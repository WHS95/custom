"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Lock } from "lucide-react"

export default function AdminLoginPage() {
  const [id, setId] = useState("")
  const [pw, setPw] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (id === "runhouse" && pw === "runhouse") {
      // Set secure cookie or simple localstorage for this MVP
      document.cookie = "admin_auth=true; path=/"
      toast.success("Welcome, Administrator")
      router.push("/admin/dashboard")
    } else {
      toast.error("Invalid credentials")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-black rounded-full">
                <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">RunHouse Admin</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to manage store settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">Admin ID</Label>
              <Input 
                id="id" 
                placeholder="ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-black hover:bg-gray-800">
              Access Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
