"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useStudioConfig, HatView } from "@/lib/store/studio-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Upload, Plus, Trash, ExternalLink } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const { config, updateConfig, resetConfig } = useStudioConfig()
  const [localPrice, setLocalPrice] = useState(config.basePrice)
  
  // Auth check
  useEffect(() => {
    if (!document.cookie.includes("admin_auth=true")) {
      router.push("/admin/login")
    }
  }, [router])

  // Sync state
  useEffect(() => {
    setLocalPrice(config.basePrice)
  }, [config.basePrice])

  const [selectedZoneView, setSelectedZoneView] = useState<HatView>('front')

  const handlePriceSave = () => {
    updateConfig({ ...config, basePrice: localPrice })
    toast.success("Base price updated")
  }

  const handleImageUpload = (colorId: string, view: HatView, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        const newColors = config.colors.map(c => {
            if (c.id === colorId) {
                return {
                    ...c,
                    views: { ...c.views, [view]: base64 }
                }
            }
            return c
        })
        updateConfig({ ...config, colors: newColors })
        toast.success(`${colorId.toUpperCase()} - ${view} image uploaded`)
    }
    reader.readAsDataURL(file)
  }

  const handleZoneUpdate = (view: HatView, field: 'x'|'y'|'width'|'height', value: number) => {
      updateConfig({
          ...config,
          safeZones: {
              ...config.safeZones,
              [view]: { ...config.safeZones[view], [field]: value }
          }
      })
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500">Manage products, pricing, and visual studio settings.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/')}>
                <ExternalLink className="mr-2 h-4 w-4" /> Go to Studio
            </Button>
            <Button variant="destructive" onClick={() => {
                if (confirm("Reset all settings to default?")) resetConfig()
            }}>
                Reset Default
            </Button>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-4">
          <TabsTrigger value="products">Product & Pricing</TabsTrigger>
          <TabsTrigger value="zones">Print Zones</TabsTrigger>
          <TabsTrigger value="assets">Hat Assets</TabsTrigger>
        </TabsList>

        {/* Tab 1: Products & Pricing */}
        <TabsContent value="products" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Global Pricing</CardTitle>
                    <CardDescription>Base price for single item (before bulk discounts)</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="w-full max-w-xs space-y-2">
                        <Label>Base Price (KRW)</Label>
                        <Input 
                            type="number" 
                            value={localPrice} 
                            onChange={(e) => setLocalPrice(Number(e.target.value))}
                        />
                    </div>
                    <Button onClick={handlePriceSave}>Save Price</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Color Options</CardTitle>
                    <CardDescription>Manage available hat colors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {config.colors.map(color => (
                        <div key={color.id} className="flex items-center gap-4 border p-4 rounded-lg">
                            <div className="w-10 h-10 rounded-full border shadow-sm" style={{ backgroundColor: color.hex }} />
                            <div className="flex-1">
                                <p className="font-bold">{color.label}</p>
                                <p className="text-xs text-gray-500">ID: {color.id} | HEX: {color.hex}</p>
                            </div>
                            <Button variant="ghost" size="icon"><Trash className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add New Color
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>


        <TabsContent value="zones">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Preview */}
                <div className="bg-gray-100 p-8 rounded-xl flex items-center justify-center min-h-[400px]">
                    <div className="relative w-[300px] h-[300px] bg-white shadow-sm border">
                         {/* Placeholder Hat - Sync with active color if possible, or just first color */}
                         <img src={config.colors[0].views[selectedZoneView]} className="w-full h-full object-contain opacity-50" />
                         
                         {/* Zone Box */}
                         <div 
                            className="absolute border-2 border-dashed border-red-500 bg-red-500/10 flex items-center justify-center text-xs text-red-600 font-bold"
                            style={{
                                left: `${config.safeZones[selectedZoneView].x}%`,
                                top: `${config.safeZones[selectedZoneView].y}%`,
                                width: `${config.safeZones[selectedZoneView].width}%`,
                                height: `${config.safeZones[selectedZoneView].height}%`,
                            }}
                         >
                            {selectedZoneView.toUpperCase()} ZONE
                         </div>
                    </div>
                </div>

                {/* Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle>Zone Settings</CardTitle>
                        <CardDescription>Select view to edit printable area</CardDescription>
                        
                        <div className="flex gap-2 mt-2">
                            {(['front', 'left', 'right', 'back', 'top'] as HatView[]).map(v => (
                                <Button 
                                    key={v} 
                                    size="sm" 
                                    variant={selectedZoneView === v ? "default" : "outline"}
                                    onClick={() => setSelectedZoneView(v)}
                                >{v.toUpperCase()}</Button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(['x', 'y', 'width', 'height'] as const).map(field => (
                            <div key={field} className="space-y-1">
                                <div className="flex justify-between">
                                    <Label className="uppercase">{field} (%)</Label>
                                    <span className="text-sm text-gray-500">{config.safeZones[selectedZoneView][field]}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={config.safeZones[selectedZoneView][field]} 
                                    onChange={(e) => handleZoneUpdate(selectedZoneView, field, Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* Tab 3: Assets */}
        <TabsContent value="assets">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.colors.map(color => (
                    <Card key={color.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.hex }}/> 
                                {color.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(['front', 'left', 'right', 'back', 'top'] as HatView[]).map(view => (
                                <div key={view} className="flex items-center gap-4 border-b pb-2 last:border-0">
                                    <div className="w-16 h-16 bg-gray-50 rounded border flex-shrink-0 relative overflow-hidden">
                                        <img src={color.views[view]} className="w-full h-full object-contain"/>
                                    </div>
                                    <div className="flex-1">
                                        <Label className="uppercase text-xs">{view} View</Label>
                                        <Input 
                                            type="file" 
                                            className="h-8 text-xs mt-1" 
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(color.id, view, e)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
             </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
