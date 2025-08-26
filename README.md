# 🐦 BirdTag - Pollinator Monitoring System

## 🎥 Demo Video
👉 **[View 7-minute Demo on Google Drive](https://drive.google.com/file/d/1UawWmEFmgT_LsmSkYWTTGzmihtUVSd9a/view?usp=sharing)**

## 🎯 What This Demo Shows
Complete **React/TypeScript frontend** for ecological monitoring workflows - upload, search, manage, and analyze pollinator media files with AI assistance.

## 📌 Project Background
**BirdTag** was originally developed as a full-stack bird species monitoring system with AWS backend. For this demo, I adapted it for **pollinators** (bees, butterflies, beetles, etc.) to showcase frontend capabilities while maintaining the robust technical foundation.

👉 *Some code still retains "BirdTag" naming, reflecting authentic project origins and demonstrating how systems can flexibly adapt to different research domains.*

---

## 🚀 Key Features I Built

### 📤 **Upload System** 
Drag & drop interface, real-time progress tracking, automatic Base64 conversion for AI processing

### 🔍 **Multi-Modal Search**
Four search methods: species tags, species names, URL lookup, and file similarity matching

### 📊 **Results Management**
Filter by media type, sort options, bulk selection, download files, copy shareable links

### 🏷️ **Smart Tag Management**
Separate AI-detected vs manual tags, bulk editing operations, species autocomplete

### 📧 **Notification System**
Subscribe to species alerts (designed for AWS SNS integration in full system)

### 👤 **User Management**
Profile pages, session handling (designed for AWS Cognito integration)

---

## 🛠 Technical Implementation

### **Frontend Stack**
- **React 18 + TypeScript** - Type-safe component architecture
- **React Router** - Multi-page application with protected routes  
- **Custom Hooks** - Reusable state management for complex operations
- **Responsive CSS** - Mobile-first design with modern layouts

### **Original Full-Stack Context** 
- **Backend**: AWS S3, Lambda functions, Cognito, DynamoDB, SNS
- **Demo Adaptation**: Mock APIs + localStorage, preserving RESTful interfaces for seamless backend integration

### **User Experience Design**
- Progressive disclosure for complex workflows
- Error prevention and clear feedback
- Bulk operations for efficiency  
- Familiar interaction patterns

---

## 📂 Project Structure
```
├── react/                    # 🎨 My Frontend Implementation (Main Focus)
│   ├── src/pages/           # Application pages (Upload, Search, Tags, etc.)
│   ├── src/components/      # Reusable UI components  
│   ├── src/styles/         # CSS styling and responsive design
│   └── src/demoData/       # Demo data simulation layer
├── backend-reference/       # 🔧 Original Team Backend (Reference Only)
│   ├── lambda functions and AWS services
│   └── shows full-stack project context
├── README.md               # This file
├── TECHNICAL_SUMMARY.md    # Detailed technical documentation
└── DESIGN_RATIONALE.md     # UX design process and decisions
```

## 🚀 Quick Start
```bash
cd react
npm install
npm run dev
```

## 📖 Documentation
📄 **[Technical Summary](./TECHNICAL_SUMMARY.md)** - Implementation details, architecture decisions, and technical approach  
📄 **[Design Rationale](./DESIGN_RATIONALE.md)** - User experience design process, research insights, and interface principles

---

## 💡 Why This Demo Matters
This project demonstrates my ability to:
- **Build complete user interfaces** end-to-end, not just isolated components
- **Understand domain problems** and translate research needs into practical tools  
- **Handle complex data workflows** with intuitive user experiences
- **Adapt existing systems** for new research domains while maintaining technical quality
- **Work independently** while designing for future team collaboration

Perfect for research environments where I need to understand scientific workflows and create tools that researchers actually want to use.