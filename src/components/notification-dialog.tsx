"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import type { Bus } from "@/lib/bus-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhatsAppIcon } from "./icons";

const notificationSchema = z.object({
  stop: z.string().min(1, "Please select a stop."),
  phone: z.string().min(10, "Please enter a valid phone number."),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface NotificationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  bus: Bus | null;
}

export function NotificationDialog({
  isOpen,
  onOpenChange,
  bus,
}: NotificationDialogProps) {
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      stop: "",
      phone: "",
    },
  });

  function onSubmit(data: NotificationFormValues) {
    if (!bus) return;

    const phoneNumber = data.phone.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `🔔 *Kerala Rides Notification* 🔔\n\nI'd like to get a notification for KSRTC bus *${bus.number}* (${bus.routeName}) arriving at *${data.stop}* stop.`
    );
    
    // Note: This is a simulation. In a real app, this would trigger a backend service.
    // For now, it opens WhatsApp with a pre-filled message.
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
    }

    toast({
      title: "Notification Set (Simulation)",
      description: `A message has been prepared for WhatsApp to set up your notification for ${data.stop}.`,
    });
    onOpenChange(false);
    form.reset();
  }

  if (!bus) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Set Arrival Notification</DialogTitle>
          <DialogDescription>
            Get a WhatsApp alert when your bus is approaching the stop.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stop</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stop" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bus.stops.map((stop) => (
                        <SelectItem key={stop.name} value={stop.name}>
                          {stop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 919876543210"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">
                <WhatsAppIcon className="w-4 h-4 mr-2" />
                Set Notification
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
