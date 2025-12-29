"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { addFamilyMember } from "@/lib/api";

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentMemberCount: number;
  maxMembers: number;
}

export function AddFamilyMemberModal({
  isOpen,
  onClose,
  onSuccess,
  currentMemberCount,
  maxMembers,
}: AddFamilyMemberModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
    activityLevel: "",
    religiousDiet: "none",
    medicalConditions: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the member's name.",
        variant: "destructive",
      });
      return;
    }

    if (currentMemberCount >= maxMembers) {
      toast({
        title: "Member limit reached",
        description: `You can only add up to ${maxMembers} family members.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await addFamilyMember({
        name: formData.name,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        gender: formData.gender || undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        currentWeight: formData.currentWeight ? parseFloat(formData.currentWeight) : undefined,
        targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : undefined,
        activityLevel: formData.activityLevel || undefined,
        religiousDiet: formData.religiousDiet || "none",
        medicalConditions: formData.medicalConditions,
      });

      toast({
        title: "Member added!",
        description: `${formData.name} has been added to your family.`,
      });

      // Reset form
      setFormData({
        name: "",
        age: "",
        gender: "",
        height: "",
        currentWeight: "",
        targetWeight: "",
        activityLevel: "",
        religiousDiet: "none",
        medicalConditions: [],
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add family member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase">
            Add Family Member
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new family member to create personalized meal plans for them.
            {currentMemberCount > 0 && (
              <span className="block mt-1">
                {currentMemberCount} of {maxMembers} members added.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-black/40 border-white/20 text-white"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Age</Label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="bg-black/40 border-white/20 text-white"
                placeholder="30"
                min="1"
                max="120"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Gender</Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
              className="grid grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" className="border-white/20" />
                <Label htmlFor="male" className="text-gray-300 cursor-pointer">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" className="border-white/20" />
                <Label htmlFor="female" className="text-gray-300 cursor-pointer">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" className="border-white/20" />
                <Label htmlFor="other" className="text-gray-300 cursor-pointer">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Height (cm)</Label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="bg-black/40 border-white/20 text-white"
                placeholder="170"
                min="50"
                max="250"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Current Weight (kg)</Label>
              <Input
                type="number"
                value={formData.currentWeight}
                onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                className="bg-black/40 border-white/20 text-white"
                placeholder="70"
                min="20"
                max="300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Target Weight (kg)</Label>
              <Input
                type="number"
                value={formData.targetWeight}
                onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                className="bg-black/40 border-white/20 text-white"
                placeholder="65"
                min="20"
                max="300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Activity Level</Label>
            <RadioGroup
              value={formData.activityLevel}
              onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}
              className="grid grid-cols-2 gap-4"
            >
              {["sedentary", "light", "moderate", "active", "athlete"].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <RadioGroupItem value={level} id={level} className="border-white/20" />
                  <Label htmlFor={level} className="text-gray-300 cursor-pointer capitalize">
                    {level.replace("_", " ")}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Religious Diet</Label>
            <RadioGroup
              value={formData.religiousDiet}
              onValueChange={(value) => setFormData({ ...formData, religiousDiet: value })}
              className="grid grid-cols-3 gap-4"
            >
              {["none", "halal", "kosher", "jain", "hindu", "buddhist"].map((diet) => (
                <div key={diet} className="flex items-center space-x-2">
                  <RadioGroupItem value={diet} id={diet} className="border-white/20" />
                  <Label htmlFor={diet} className="text-gray-300 cursor-pointer capitalize">
                    {diet}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-black font-bold"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

