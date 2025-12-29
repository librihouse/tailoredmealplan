"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus } from "lucide-react";
import { AddFamilyMemberModal } from "./AddFamilyMemberModal";

export interface FamilyMember {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  height?: number;
  current_weight?: number;
  target_weight?: number;
  activity_level?: string;
  religious_diet?: string;
  medical_conditions?: string[];
}

interface FamilyMemberSelectorProps {
  members: FamilyMember[];
  selectedMemberId: string | null;
  onMemberChange: (memberId: string | null) => void;
  onMemberAdded: () => void;
  maxMembers?: number;
}

export function FamilyMemberSelector({
  members,
  selectedMemberId,
  onMemberChange,
  onMemberAdded,
  maxMembers = 5,
}: FamilyMemberSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canAddMore = members.length < maxMembers;

  const handleAddMember = () => {
    if (canAddMore) {
      setIsModalOpen(true);
    }
  };

  const handleMemberAdded = () => {
    setIsModalOpen(false);
    onMemberAdded();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-white">Member:</span>
      </div>
      <Select
        value={selectedMemberId || undefined}
        onValueChange={(value) => onMemberChange(value === "add" ? null : value)}
      >
        <SelectTrigger className="w-[200px] bg-gray-900/50 border-white/10 text-white">
          <SelectValue placeholder="Select member" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-white/10">
          {members.map((member) => (
            <SelectItem
              key={member.id}
              value={member.id}
              className="text-white hover:bg-white/10 focus:bg-white/10"
            >
              {member.name}
            </SelectItem>
          ))}
          {canAddMore && (
            <SelectItem
              value="add"
              className="text-primary hover:bg-primary/10 focus:bg-primary/10 font-medium"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Member
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {canAddMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddMember}
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      )}

      <AddFamilyMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleMemberAdded}
        currentMemberCount={members.length}
        maxMembers={maxMembers}
      />
    </div>
  );
}

