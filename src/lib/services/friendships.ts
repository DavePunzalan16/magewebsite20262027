import { createAdminClient } from "@/lib/supabase/server";

export class FriendshipService {
  private db = createAdminClient();

  async sendRequest(requesterId: string, receiverId: string) {
    if (requesterId === receiverId) return { error: "Cannot friend yourself" };

    // Check if already exists
    const { data: existing } = await this.db
      .from("friendships")
      .select("id, status")
      .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
      .single();

    if (existing) {
      if (existing.status === "accepted") return { error: "Already friends" };
      if (existing.status === "pending") return { error: "Request already pending" };
    }

    const { error } = await this.db.from("friendships").insert({ requester_id: requesterId, receiver_id: receiverId });
    if (error) return { error: error.message };
    return { success: true };
  }

  async acceptRequest(friendshipId: number, userId: string) {
    const { error } = await this.db
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId)
      .eq("receiver_id", userId);
    if (error) return { error: error.message };
    return { success: true };
  }

  async rejectRequest(friendshipId: number, userId: string) {
    const { error } = await this.db
      .from("friendships")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", friendshipId)
      .eq("receiver_id", userId);
    if (error) return { error: error.message };
    return { success: true };
  }

  async removeFriend(friendshipId: number, userId: string) {
    const { error } = await this.db
      .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
    if (error) return { error: error.message };
    return { success: true };
  }

  async getPendingRequests(userId: string) {
    const { data } = await this.db
      .from("friendships")
      .select("id, requester_id, created_at, profiles!friendships_requester_id_fkey(full_name, avatar_url)")
      .eq("receiver_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    return data || [];
  }

  async getFriends(userId: string) {
    const { data } = await this.db
      .from("friendships")
      .select("id, requester_id, receiver_id, created_at")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (!data) return [];

    // Get friend profiles
    const friendIds = data.map((f) => f.requester_id === userId ? f.receiver_id : f.requester_id);
    if (friendIds.length === 0) return [];

    const { data: profiles } = await this.db.from("profiles").select("id, full_name, avatar_url").in("id", friendIds);
    return profiles || [];
  }

  async getFriendshipStatus(userId: string, otherUserId: string): Promise<"none" | "pending_sent" | "pending_received" | "accepted"> {
    const { data } = await this.db
      .from("friendships")
      .select("id, status, requester_id")
      .or(`and(requester_id.eq.${userId},receiver_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .single();

    if (!data) return "none";
    if (data.status === "accepted") return "accepted";
    if (data.status === "pending" && data.requester_id === userId) return "pending_sent";
    if (data.status === "pending") return "pending_received";
    return "none";
  }

  async getPendingCount(userId: string): Promise<number> {
    const { count } = await this.db
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("status", "pending");
    return count || 0;
  }
}
