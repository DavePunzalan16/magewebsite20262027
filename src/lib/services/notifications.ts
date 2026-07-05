import { NotificationRepository } from "@/lib/repositories/notifications";

export class NotificationService {
  private repo: NotificationRepository;

  constructor() {
    this.repo = new NotificationRepository();
  }

  // === Business logic methods (design spec) ===

  async notifyComment(postAuthorId: string, actorId: string, postId: number, commentPreview: string): Promise<void> {
    if (postAuthorId === actorId) return; // Don't self-notify
    await this.repo.create({
      userId: postAuthorId,
      type: "comment",
      title: "New comment on your post",
      body: commentPreview.slice(0, 100),
      entityType: "post",
      entityId: String(postId),
      actorId,
    });
  }

  async notifyReaction(postAuthorId: string, actorId: string, postId: number): Promise<void> {
    if (postAuthorId === actorId) return; // Don't self-notify
    await this.repo.create({
      userId: postAuthorId,
      type: "reaction",
      title: "Someone reacted to your post",
      body: "Your post received a new reaction",
      entityType: "post",
      entityId: String(postId),
      actorId,
    });
  }

  async notifyModeration(postAuthorId: string, adminId: string, postId: number, action: string, reason?: string): Promise<void> {
    // No self-notification prevention for moderation - admin actions always notify
    await this.repo.create({
      userId: postAuthorId,
      type: "moderation",
      title: `Your post was ${action}`,
      body: reason || `An admin has ${action} your post.`,
      entityType: "post",
      entityId: String(postId),
      actorId: adminId,
    });
  }

  // === Legacy methods (used by existing API routes, will be refactored in later tasks) ===

  async getByUser(userId: string, limit = 20, offset = 0) {
    const notifications = await this.repo.findByUser({ userId, limit, offset });
    return { notifications, total: notifications.length };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.getUnreadCount(userId);
  }

  async markAsRead(notificationId: number, userId: string): Promise<void> {
    await this.repo.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repo.markAllAsRead(userId);
  }

  /** @deprecated Use notifyReaction() instead */
  async onReaction(postAuthorId: string, actorId: string, postId: number, _actorName: string): Promise<void> {
    await this.notifyReaction(postAuthorId, actorId, postId);
  }

  /** @deprecated Use notifyComment() instead */
  async onComment(postAuthorId: string, actorId: string, postId: number, actorName: string): Promise<void> {
    await this.notifyComment(postAuthorId, actorId, postId, actorName);
  }

  /** @deprecated Use notifyModeration() instead */
  async onModeration(postAuthorId: string, action: string, reason?: string): Promise<void> {
    await this.repo.create({
      userId: postAuthorId,
      type: "moderation",
      title: `Your post was ${action}`,
      body: reason || `An admin has ${action} your post.`,
      entityType: "moderation",
    });
  }
}
