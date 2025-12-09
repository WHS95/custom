import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

export default function GalleryPage() {
  // Mock Data
  const reviews = [
    { id: 1, crew: "SRC Seoul", image: "/assets/hats/black.png", review: "Perfect fit for our night runs. The black is sleek.", rating: 5 },
    { id: 2, crew: "Busan Runners", image: "/assets/hats/khaki.png", review: "Material is very breathable.", rating: 5 },
    { id: 3, crew: "Jeju Strides", image: "/assets/hats/beige.png", review: "Delivery was faster than expected.", rating: 4 },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
             <h1 className="text-3xl font-bold">Crew Showcase</h1>
             <p className="text-muted-foreground">See how other crews are rocking their gear.</p>
        </div>
        <div className="bg-primary/5 text-primary px-4 py-2 rounded-lg text-sm font-medium">
            📸 Post a review, get 2,000 KRW coupon!
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative bg-gray-100">
                    {/* Placeholder for real user photos - using hat assets for now */}
                    <img src={item.image} alt={item.crew} className="w-full h-full object-contain p-4 mix-blend-multiply" />
                    <Badge className="absolute top-3 left-3 bg-black/80">{item.crew}</Badge>
                </div>
                <CardContent className="p-4">
                    <div className="flex text-yellow-500 mb-2">
                        {Array(item.rating).fill(0).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <p className="text-gray-700 text-sm">"{item.review}"</p>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  )
}
