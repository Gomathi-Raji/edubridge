# EduBridge - AI-Powered Global Education Platform

## 🚀 Vision
Bridging the education gap in rural and underserved communities through satellite-enabled, AI-powered learning with real-time mentorship.

## ✨ Key Features

### 🎥 Live Streaming & Mentorship
- **WebRTC P2P Broadcasting**: Mentor streams to multiple students simultaneously
- **Real-time Chat & Q&A**: Interactive communication during sessions
- **Session Recording**: Automatic recording for later review
- **Screen Sharing**: Mentors can share presentations and code

### 🤖 AI-Powered Learning
- **Personalized AI Tutor**: 24/7 AI assistance using Gemini API
- **Smart Content Recommendations**: Adaptive learning paths
- **Automated Assessment**: AI-powered quiz generation and grading
- **Language Translation**: Multi-language support for global accessibility

### 📊 Analytics & Insights
- **Learning Analytics**: Track student progress and engagement
- **Mentor Performance**: Detailed session analytics and feedback
- **Custom Dashboards**: Role-based insights for students, mentors, and admins

### 🌐 Global Connectivity
- **Satellite Integration**: Works in low-connectivity areas
- **Offline Mode**: Download content for offline learning
- **Cross-Device Sync**: Seamless experience across devices

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Motion/React** for animations
- **Recharts** for data visualization

### Backend
- **Node.js** with Express
- **WebSocket** for real-time communication
- **SQLite** with better-sqlite3
- **WebRTC** for peer-to-peer streaming

### AI & APIs
- **Google Gemini API** for AI tutoring
- **WebRTC** for video streaming
- **WebSocket** for signaling

## 🚀 Deployment to Vercel

### Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **OpenRouter API Key**: Get from [openrouter.ai](https://openrouter.ai/)

### Step-by-Step Deployment

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login to Vercel
```bash
vercel login
```

#### 3. Deploy to Vercel
```bash
# From your project root
vercel

# Follow the prompts:
# - Link to existing project or create new? → Create new
# - Project name → edubridge (or your choice)
# - Directory → ./ (current directory)
```

#### 4. Set Environment Variables
In your Vercel dashboard or via CLI:

```bash
vercel env add OPENROUTER_API_KEY
# Enter your OpenRouter API key when prompted

# Or set via dashboard:
# Project Settings → Environment Variables
```

**Required Environment Variables:**
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `NODE_ENV`: `production` (automatically set by Vercel)

#### 5. Database Setup
The SQLite database will be automatically created on first deployment. The app includes seeded demo data.

#### Quick Deploy (Automated)
```bash
# One-command deployment
npm run deploy

# This will:
# 1. Install Vercel CLI if needed
# 2. Login to Vercel
# 3. Install dependencies
# 4. Build the project
# 5. Initialize database
# 6. Deploy to production
```

#### Manual Deploy
```bash
# Install dependencies
npm install

# Build for Vercel
npm run build:vercel

# Deploy
vercel --prod
```

#### Set Environment Variables
In your Vercel dashboard (Project Settings → Environment Variables):

- `OPENROUTER_API_KEY`: Your OpenRouter API key (required for AI tutor)
- `NODE_ENV`: `production` (automatically set)

### 🎯 What Works on Vercel

✅ **Fully Functional:**
- AI Tutor (with Gemini API key)
- QR Code Sharing
- Dashboard & Analytics
- User Management
- Session Management
- Static Frontend

⚠️ **Limited Functionality:**
- WebSocket features (chat, real-time updates) - requires separate backend

### 🚀 Demo Strategy

1. **Deploy Frontend to Vercel** (static hosting)
2. **Demo Core Features:**
   - AI Tutor interactions
   - QR code sharing
   - Dashboard analytics
   - User management
3. **For WebSocket Features:** Run locally with `npm run dev:full`

### 🔧 Troubleshooting

**Build Errors:**
```bash
# Clean and rebuild
npm run clean
npm install
npm run build:vercel
```

**API Errors:**
- Check Vercel function logs in dashboard
- Ensure environment variables are set
- Database is auto-initialized on first deploy

**WebSocket Issues:**
- WebSockets don't work on Vercel serverless
- For full functionality, deploy backend separately on Railway/Heroku

### 🌐 WebSocket Limitations on Vercel

**Important**: Vercel serverless functions don't support persistent WebSocket connections. For the hackathon demo:

**Option 1: Local Development**
- Keep WebSocket working locally
- Demo with `npm run dev:full`

**Option 2: Separate Backend**
- Deploy backend to Railway/Heroku
- Update `vercel.json` to proxy WebSocket requests

**Option 3: Polling Fallback**
- Use HTTP polling for chat/Q&A during demo
- WebRTC still works for video streaming

### 🔧 Troubleshooting

#### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules .vercel
npm install
vercel --force
```

#### Environment Variables
```bash
# Check env vars
vercel env ls

# Update env var
vercel env rm OPENROUTER_API_KEY
vercel env add OPENROUTER_API_KEY
```

#### Database Issues
- SQLite works in Vercel serverless functions
- Database is recreated on each cold start
- Consider using Vercel Postgres for production

## 🎯 Hackathon Winning Features

### 🔥 Must-Have for Demo
- [ ] **One-Click Session Setup**: Instant room creation with QR codes
- [ ] **Mobile-First Design**: Fully responsive for phones/tablets
- [ ] **Real-Time Collaboration**: Code sharing and whiteboarding
- [ ] **Gamification**: Points, badges, and leaderboards

### 🚀 Advanced Features
- [ ] **AI Content Generation**: Auto-generate courses from topics
- [ ] **Voice Commands**: Hands-free interaction
- [ ] **AR/VR Integration**: Immersive learning experiences
- [ ] **Blockchain Certificates**: Verifiable credentials

### 📈 Performance & Scale
- [ ] **CDN Integration**: Fast content delivery worldwide
- [ ] **Load Balancing**: Handle 1000+ concurrent users
- [ ] **Edge Computing**: Low-latency for global users

## 🏆 Judging Criteria Focus

### Innovation (30%)
- [ ] **Unique Value Proposition**: Rural education focus
- [ ] **AI Integration**: Smart tutoring and personalization
- [ ] **Real-time Features**: Live collaboration tools

### Technical Excellence (25%)
- [ ] **Code Quality**: Clean, documented, scalable code
- [ ] **Performance**: Fast loading, smooth streaming
- [ ] **Security**: HTTPS, input validation, secure APIs

### User Experience (25%)
- [ ] **Intuitive Design**: Easy to use for non-technical users
- [ ] **Accessibility**: WCAG compliant, multi-language
- [ ] **Mobile Experience**: Works perfectly on all devices

### Business Viability (20%)
- [ ] **Market Research**: Real problem, scalable solution
- [ ] **Monetization**: Clear revenue model
- [ ] **Sustainability**: Long-term impact potential

## 📋 Pre-Hackathon Checklist

### Day 1: Foundation
- [x] Basic WebRTC streaming
- [x] User authentication
- [x] Dashboard layouts
- [x] Real-time chat

### Day 2: Polish & Features
- [ ] Add gamification elements
- [ ] Implement AI tutor responses
- [ ] Add session recording
- [ ] Mobile responsiveness

### Day 3: Advanced Features
- [ ] QR code session sharing
- [ ] Offline content sync
- [ ] Advanced analytics
- [ ] Performance optimization

## 🚀 Quick Wins for Hackathon

1. **Add QR Code Session Sharing**
   - Generate QR codes for instant session joining
   - One-tap mobile access

2. **Gamification System**
   - Points for attendance, questions asked, participation
   - Badges for milestones
   - Leaderboards

3. **AI-Powered Quiz Generation**
   - Auto-generate quizzes from session content
   - Instant feedback and explanations

4. **Real-Time Whiteboarding**
   - Collaborative drawing during sessions
   - Save and share session notes

5. **Voice-to-Text for Accessibility**
   - Speech recognition for chat input
   - Text-to-speech for AI responses

## 🎤 Demo Script

1. **Opening**: Show the rural education problem
2. **Login**: Quick demo login as mentor/student
3. **Session Creation**: One-click session setup with QR code
4. **Live Streaming**: Show WebRTC broadcasting
5. **Interaction**: Chat, Q&A, whiteboarding
6. **AI Features**: Ask AI tutor questions
7. **Analytics**: Show engagement metrics
8. **Mobile Demo**: Switch to phone view

## 🏁 Final Tips

- **Test Everything**: Multiple devices, browsers, network conditions
- **Have Backups**: Demo offline, fallback features
- **Practice Demo**: 3-minute pitch, 2-minute Q&A
- **Show Impact**: Real-world use cases, user testimonials
- **Be Prepared**: Technical questions, scalability concerns

---

**Built with ❤️ for global education accessibility**</content>
<parameter name="filePath">c:\Users\divya\OneDrive\Desktop\edubridge\README.md