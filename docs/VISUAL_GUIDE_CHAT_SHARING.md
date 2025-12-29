# Visual Guide: Chat Post Sharing

## 🎨 UI Components Overview

### 1. Share Button (Post Card / Detail Page)

```
┌─────────────────────────────────────┐
│  Post Card                          │
│  ┌─────────────────────────────┐   │
│  │ [Post Image]                │   │
│  │ Recipe Title                │   │
│  │ @username • 2h ago          │   │
│  └─────────────────────────────┘   │
│  ❤️ 234  💬 12  📤 Share  🔖 Save │  ← Click here
└─────────────────────────────────────┘
```

### 2. Share Modal

```
┌────────────────────────────────────────────┐
│ Share Post                             [×] │
├────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐  │
│ │ [Thumb] Recipe Title                 │  │ ← Post Preview
│ │         Description snippet...       │  │
│ └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│ [🔍 Search conversations...]              │
├────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐  │
│ │ [👤] Mike Chen           [✓]         │  │ ← Selectable
│ │      Direct message                  │  │
│ ├──────────────────────────────────────┤  │
│ │ [👥] Cooking Squad       [ ]         │  │
│ │      Group chat                      │  │
│ └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│ [Add a message (optional)...]             │
│ Leave empty to use auto-generated caption │
├────────────────────────────────────────────┤
│ 2 selected              [📤 Share]        │
└────────────────────────────────────────────┘
```

### 3. Chat Message (POST_SHARE Type)

#### Sent Message (Right-aligned)

```
                    ┌──────────────────────────────┐
                    │ [🖼️]  📤 SHARED POST        │
                    │ Thumb  Chocolate Cake       │
                    │        Check out this       │
                    │        amazing recipe!      │
                    │        Tap to view post     │
                    └──────────────────────────────┘
                                       3:45 PM ✓✓
```

#### Received Message (Left-aligned)

```
[👤]
Mike  ┌──────────────────────────────┐
Chen  │ [🖼️]  📤 SHARED POST        │
      │ Thumb  Thai Green Curry     │
      │        Post shared: Thai... │
      │        Tap to view post     │
      └──────────────────────────────┘
      3:46 PM
```

### 4. Hover Effect

```
┌──────────────────────────────────┐
│ [🖼️]  📤 SHARED POST            │  ← Scale(1.02)
│ Thumb  Recipe Title             │  ← Shadow-lg
│        Message text...          │  ← Cursor: pointer
│        Tap to view post         │
└──────────────────────────────────┘
      (Clickable Link)
```

### 5. Click → Navigate

```
Click on card
     ↓
Navigate to: /post/[postId]
     ↓
┌────────────────────────────────────┐
│ Post Detail Page                   │
│ ┌──────────────────────────────┐  │
│ │ [Full Post Image]            │  │
│ │ Recipe Title                 │  │
│ │ @username • 2h ago           │  │
│ │                              │  │
│ │ Full content...              │  │
│ │                              │  │
│ │ 💬 Comments                  │  │
│ └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## 🎬 User Flow Animation

### Sharing Flow

```
1. User on Feed/Discover
   ↓
2. Clicks "Share" on post
   ↓
3. SharePostModal opens
   ↓
4. Selects conversations (checkboxes)
   ↓
5. Optionally adds custom message
   ↓
6. Clicks "Share" button
   ↓
7. Loading spinner appears
   ↓
8. Backend processes:
   - Validates post
   - Fetches snapshot
   - Caches thumbnail + title
   - Broadcasts via WebSocket
   ↓
9. Success toast: "Post shared to 2 conversations! 🎉"
   ↓
10. Modal closes automatically
```

### Receiving Flow

```
1. User in Messages page
   ↓
2. WebSocket delivers new message
   ↓
3. Real-time message appears (no refresh needed)
   ↓
4. Preview card shows:
   - Thumbnail image
   - Recipe title
   - "SHARED POST" badge
   - Message caption
   ↓
5. User clicks card
   ↓
6. Navigates to /post/[postId]
   ↓
7. Full post detail loads
```

## 🎨 Design Tokens

### POST_SHARE Card Styling

```css
/* Base Card */
.post-share-card {
	max-width:
		320px (mobile),
		384px (desktop);
	border-radius: 16px;
	overflow: hidden;
	border: 1px solid;
	transition: all 200ms;
}

/* Own Message (Right) */
.own {
	background: primary/10;
	border-color: primary/30;
	border-bottom-right-radius: 4px; /* Tail */
}

/* Received Message (Left) */
.received {
	background: bg-elevated;
	border-color: border-subtle;
	border-bottom-left-radius: 4px; /* Tail */
}

/* Hover State */
.post-share-card:hover {
	transform: scale(1.02);
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Thumbnail */
.thumbnail {
	width: 64px;
	height: 64px;
	border-radius: 8px;
	object-fit: cover;
	flex-shrink: 0;
}

/* Badge */
.badge {
	font-size: 10px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	display: flex;
	align-items: center;
	gap: 4px;
}

/* Title */
.title {
	font-size: 12px;
	font-weight: 700;
	line-clamp: 1;
}

/* Content */
.content {
	font-size: 14px;
	line-height: 1.5;
	line-clamp: 2;
}

/* Footer */
.footer {
	font-size: 12px;
	opacity: 0.7;
	margin-top: 4px;
}
```

## 📱 Responsive Behavior

### Mobile (< 768px)

```
┌─────────────────┐
│ Messages        │
│ [🔍 Search]     │
├─────────────────┤
│ [👤] Mike Chen  │ ← Conversation List
│ [👥] Squad      │   (Full screen)
│ [👤] Sarah      │
└─────────────────┘

Tap conversation ↓

┌─────────────────┐
│ ← Mike Chen  🟢 │ ← Chat Area
├─────────────────┤   (Full screen)
│                 │
│ [POST_SHARE]    │
│                 │
│                 │
├─────────────────┤
│ [Type message...│
└─────────────────┘
```

### Desktop (≥ 768px)

```
┌─────────────┬──────────────────────────┐
│ Messages    │ Mike Chen  🟢            │
│ [🔍 Search] ├──────────────────────────┤
├─────────────┤                          │
│ [👤] Mike   │  [POST_SHARE]            │
│ [👥] Squad  │                          │
│ [👤] Sarah  │  [POST_SHARE]            │
│             │                          │
│             ├──────────────────────────┤
│             │ [Type message...]        │
└─────────────┴──────────────────────────┘
  320px          Remaining space
  (Sidebar)      (Chat area)
```

## 🎯 Interactive States

### POST_SHARE Card States

```
1. Default
   └─→ Border: subtle
       Shadow: none
       Scale: 1

2. Hover
   └─→ Border: same
       Shadow: large
       Scale: 1.02
       Cursor: pointer

3. Active (Click)
   └─→ Scale: 0.98
       Opacity: 0.9

4. Navigation
   └─→ Next.js route transition
       Loading indicator
       Page load
```

## 🔍 Debug Indicators

### Console Logs to Look For

```javascript
// On share action
[SharePost] Sending POST_SHARE request: {
  conversationId: "conv-123",
  postId: "post-456",
  hasCustomMessage: true
}

// Backend response
[SharePost] Backend cached snapshot: {
  hasImage: true,
  hasTitle: true,
  messagePreview: "Post shared: Recipe Title"
}

// WebSocket delivery
[WebSocket] POST_SHARE received: {
  id: "msg-789",
  type: "POST_SHARE",
  relatedId: "post-456",
  hasImage: true,
  hasTitle: true,
  image: "https://...",
  title: "Recipe Title"
}
```

## 🎁 Visual Polish Details

### Micro-interactions

- **Card Hover**: Smooth scale + shadow transition (200ms)
- **Badge Icon**: Share icon with primary color
- **Image Loading**: Placeholder → fade in when loaded
- **Click Feedback**: Quick scale down (0.98) before navigation
- **Toast Notification**: Slide in from top with success color

### Accessibility

- **Alt Text**: "Shared post" for images
- **ARIA Label**: "View shared post: [Recipe Title]"
- **Keyboard Nav**: Focusable link with outline
- **Screen Reader**: Announces type, title, and action

### Error Handling

```
No Thumbnail Available
┌──────────────────────────────────┐
│ [📄]  📤 SHARED POST             │
│ Gray  Recipe Title               │
│       Message text...            │
│       Tap to view post           │
└──────────────────────────────────┘
    (Placeholder icon)
```

---

**Note**: All colors, spacing, and animations follow the design system defined in `DESIGN_SYSTEM.md` and use Tailwind CSS utility classes for consistency.
