import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, CheckCircle, Clock } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order Status</h1>

      <div className="space-y-6">
        {/* Active Order */}
        <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Order #2024-001 (SRC Seoul)</CardTitle>
                        <CardDescription>Placed on Oct 24, 2024</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">In Production</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                    <div className="space-y-6 relative">
                        <TimelineItem 
                            icon={CheckCircle} 
                            title="Order Confirmed" 
                            date="Oct 24, 10:00 AM" 
                            status="done" 
                        />
                        <TimelineItem 
                            icon={CheckCircle} 
                            title="Design Approved" 
                            date="Oct 25, 14:30 PM" 
                            desc="Mockup confirmed by Crew Leader"
                            status="done"
                        />
                         <TimelineItem 
                            icon={Clock} 
                            title="Manufacturing" 
                            date="Expected Nov 10" 
                            desc="Fabric cutting in progress..."
                            status="active"
                        />
                         <TimelineItem 
                            icon={Truck} 
                            title="Shipping" 
                            date="Pending" 
                            status="pending"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Past Order */}
        <Card className="opacity-60">
             <CardHeader>
                 <CardTitle>Sample Order #000-TEST</CardTitle>
                 <Badge>Delivered</Badge>
             </CardHeader>
        </Card>
      </div>
    </div>
  )
}

function TimelineItem({ icon: Icon, title, date, desc, status }: any) {
    const isDone = status === "done"
    const isActive = status === "active"
    
    return (
        <div className="flex gap-4 items-start">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 
                ${isDone ? "bg-green-100 text-green-600" : isActive ? "bg-orange-100 text-orange-600 ring-4 ring-white" : "bg-gray-100 text-gray-400"}`}>
                <Icon size={16} />
            </div>
            <div>
                <div className={`font-medium ${isActive ? "text-orange-700" : "text-gray-900"}`}>{title}</div>
                <div className="text-xs text-gray-500">{date}</div>
                {desc && <div className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">{desc}</div>}
            </div>
        </div>
    )
}
