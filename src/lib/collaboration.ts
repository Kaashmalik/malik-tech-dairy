/**
 * Collaboration Features
 * Real-time collaboration, comments, and activity feeds
 */

import { getSupabaseClient } from '@/lib/supabase/server';

export interface Comment {
  id: string;
  resourceId: string;
  resourceType: 'animal' | 'milk_log' | 'health_record' | 'expense' | 'sale';
  userId: string;
  userName: string;
  content: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: 'comment' | 'mention' | 'assignment' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

/**
 * Add comment to a resource
 */
export async function addComment(params: {
  tenantId: string;
  userId: string;
  userName: string;
  resourceId: string;
  resourceType: Comment['resourceType'];
  content: string;
  mentions?: string[];
}): Promise<Comment> {
  const supabase = getSupabaseClient();

  // Extract mentions from content
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(params.content)) !== null) {
    mentions.push(match[1]);
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      tenant_id: params.tenantId,
      user_id: params.userId,
      user_name: params.userName,
      resource_id: params.resourceId,
      resource_type: params.resourceType,
      content: params.content,
      mentions: mentions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to add comment');
  }

  // Create notifications for mentions
  for (const mentionedUserId of mentions) {
    await createNotification({
      tenantId: params.tenantId,
      userId: mentionedUserId,
      type: 'mention',
      title: 'You were mentioned',
      message: `${params.userName} mentioned you in a comment`,
      actionUrl: `/${params.resourceType}s/${params.resourceId}`,
    });
  }

  // Log activity
  await logActivity({
    tenantId: params.tenantId,
    userId: params.userId,
    userName: params.userName,
    action: 'commented',
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    resourceTitle: `Comment on ${params.resourceType}`,
    details: { comment: params.content.substring(0, 100) },
  });

  return {
    id: data.id,
    resourceId: data.resource_id,
    resourceType: data.resource_type,
    userId: data.user_id,
    userName: data.user_name,
    content: data.content,
    mentions: data.mentions,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Get comments for a resource
 */
export async function getComments(params: {
  tenantId: string;
  resourceId: string;
  resourceType: Comment['resourceType'];
}): Promise<Comment[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .eq('resource_id', params.resourceId)
    .eq('resource_type', params.resourceType)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(comment => ({
    id: comment.id,
    resourceId: comment.resource_id,
    resourceType: comment.resource_type,
    userId: comment.user_id,
    userName: comment.user_name,
    content: comment.content,
    mentions: comment.mentions,
    createdAt: new Date(comment.created_at),
    updatedAt: new Date(comment.updated_at),
  }));
}

/**
 * Update comment
 */
export async function updateComment(
  commentId: string,
  content: string,
  userId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('comments')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to update comment');
  }
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to delete comment');
  }
}

/**
 * Log activity
 */
export async function logActivity(params: {
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase.from('activity_feed').insert({
    tenant_id: params.tenantId,
    user_id: params.userId,
    user_name: params.userName,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    resource_title: params.resourceTitle,
    details: params.details,
    created_at: new Date().toISOString(),
  });
}

/**
 * Get activity feed for tenant
 */
export async function getActivityFeed(tenantId: string, limit: number = 50): Promise<Activity[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activity_feed')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(activity => ({
    id: activity.id,
    tenantId: activity.tenant_id,
    userId: activity.user_id,
    userName: activity.user_name,
    action: activity.action,
    resourceType: activity.resource_type,
    resourceId: activity.resource_id,
    resourceTitle: activity.resource_title,
    details: activity.details,
    createdAt: new Date(activity.created_at),
  }));
}

/**
 * Create notification
 */
export async function createNotification(params: {
  tenantId: string;
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  actionUrl?: string;
}): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase.from('notifications').insert({
    tenant_id: params.tenantId,
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    action_url: params.actionUrl,
    read: false,
    created_at: new Date().toISOString(),
  });
}

/**
 * Get notifications for user
 */
export async function getNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  const supabase = getSupabaseClient();

  let query = supabase.from('notifications').select('*').eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

  if (error || !data) {
    return [];
  }

  return data.map(notification => ({
    id: notification.id,
    tenantId: notification.tenant_id,
    userId: notification.user_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    actionUrl: notification.action_url,
    createdAt: new Date(notification.created_at),
  }));
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    return 0;
  }

  return count || 0;
}

/**
 * Assign task to user
 */
export async function assignTask(params: {
  tenantId: string;
  taskId: string;
  taskTitle: string;
  assignedBy: string;
  assignedTo: string;
  assignedByName: string;
  assignedToName: string;
}): Promise<void> {
  const supabase = getSupabaseClient();

  // Create task assignment
  await supabase.from('task_assignments').insert({
    tenant_id: params.tenantId,
    task_id: params.taskId,
    task_title: params.taskTitle,
    assigned_by: params.assignedBy,
    assigned_to: params.assignedTo,
    assigned_by_name: params.assignedByName,
    assigned_to_name: params.assignedToName,
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  // Create notification
  await createNotification({
    tenantId: params.tenantId,
    userId: params.assignedTo,
    type: 'assignment',
    title: 'New Task Assigned',
    message: `${params.assignedByName} assigned you a task: ${params.taskTitle}`,
    actionUrl: `/tasks/${params.taskId}`,
  });

  // Log activity
  await logActivity({
    tenantId: params.tenantId,
    userId: params.assignedBy,
    userName: params.assignedByName,
    action: 'assigned',
    resourceType: 'task',
    resourceId: params.taskId,
    resourceTitle: params.taskTitle,
    details: { assignedTo: params.assignedToName },
  });
}

/**
 * Get tasks for user
 */
export async function getUserTasks(
  userId: string,
  status?: 'pending' | 'in_progress' | 'completed'
): Promise<
  Array<{
    id: string;
    taskId: string;
    taskTitle: string;
    assignedBy: string;
    assignedByName: string;
    status: string;
    createdAt: Date;
    dueDate?: Date;
  }>
> {
  const supabase = getSupabaseClient();

  let query = supabase.from('task_assignments').select('*').eq('assigned_to', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(task => ({
    id: task.id,
    taskId: task.task_id,
    taskTitle: task.task_title,
    assignedBy: task.assigned_by,
    assignedByName: task.assigned_by_name,
    status: task.status,
    createdAt: new Date(task.created_at),
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
  }));
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskAssignmentId: string,
  status: 'pending' | 'in_progress' | 'completed',
  userId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('task_assignments')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskAssignmentId)
    .eq('assigned_to', userId);
}

/**
 * Get team members
 */
export async function getTeamMembers(tenantId: string): Promise<
  Array<{
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    avatar?: string;
  }>
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('tenant_members')
    .select(
      `
      user_id,
      role,
      platform_users (
        email,
        name,
        avatar_url
      )
    `
    )
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  if (error || !data) {
    return [];
  }

  return data.map(member => {
    const platformUser = Array.isArray(member.platform_users)
      ? member.platform_users[0]
      : member.platform_users;
    return {
      userId: member.user_id,
      userName: platformUser?.name || 'Unknown',
      userEmail: platformUser?.email || '',
      role: member.role,
      avatar: platformUser?.avatar_url,
    };
  });
}

/**
 * Share resource with team
 */
export async function shareResource(params: {
  tenantId: string;
  userId: string;
  userName: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  sharedWith: string[];
}): Promise<void> {
  const supabase = getSupabaseClient();

  // Create share records
  for (const sharedUserId of params.sharedWith) {
    await supabase.from('resource_shares').insert({
      tenant_id: params.tenantId,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      resource_title: params.resourceTitle,
      shared_by: params.userId,
      shared_by_name: params.userName,
      shared_with: sharedUserId,
      created_at: new Date().toISOString(),
    });

    // Create notification
    await createNotification({
      tenantId: params.tenantId,
      userId: sharedUserId,
      type: 'system',
      title: 'Resource Shared',
      message: `${params.userName} shared a ${params.resourceType} with you`,
      actionUrl: `/${params.resourceType}s/${params.resourceId}`,
    });
  }

  // Log activity
  await logActivity({
    tenantId: params.tenantId,
    userId: params.userId,
    userName: params.userName,
    action: 'shared',
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    resourceTitle: params.resourceTitle,
    details: { sharedWith: params.sharedWith.length },
  });
}

/**
 * Get shared resources for user
 */
export async function getSharedResources(userId: string): Promise<
  Array<{
    id: string;
    resourceType: string;
    resourceId: string;
    resourceTitle: string;
    sharedBy: string;
    sharedByName: string;
    createdAt: Date;
  }>
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('resource_shares')
    .select('*')
    .eq('shared_with', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(share => ({
    id: share.id,
    resourceType: share.resource_type,
    resourceId: share.resource_id,
    resourceTitle: share.resource_title,
    sharedBy: share.shared_by,
    sharedByName: share.shared_by_name,
    createdAt: new Date(share.created_at),
  }));
}
