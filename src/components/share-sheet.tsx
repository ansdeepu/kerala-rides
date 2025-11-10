"use client";

import type { Bus } from "@/app/page";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface ShareSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  bus: Bus | null;
}

export function ShareSheet({ isOpen, onOpenChange, bus }: ShareSheetProps) {
  if (!bus) return null;

  const shareUrl = `${window.location.origin}/?bus=${bus.id}`;
  const shareText = `Track KSRTC bus ${bus.number} (${bus.routeName}) with me on Kerala Rides! It's currently ${bus.status}. ETA for ${bus.nextStopName}: ${bus.eta}.`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Kerala Rides - Bus Status",
          text: shareText,
          url: shareUrl,
        });
        onOpenChange(false);
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
            variant: "destructive",
            title: "Sharing failed",
            description: "Could not share the bus status.",
        });
      }
    } else {
        // Fallback for browsers that don't support Web Share API
        handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Bus tracking link copied to your clipboard.",
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="font-headline">Share Bus Status</SheetTitle>
          <SheetDescription>
            Share the real-time location of bus {bus.number}.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-link">Shareable Link</Label>
            <div className="flex gap-2">
              <Input id="share-link" value={shareUrl} readOnly />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleShare} className="w-full">
            Share via...
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
