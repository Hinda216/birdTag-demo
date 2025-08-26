# 🐦 BirdTag Demo (Adapted for Pollinators)

## 📌 About this Project
**BirdTag** was originally developed as a bird species monitoring system.  
For this demo, I adapted it for **pollinators** (bees, butterflies, beetles, etc.), to align with ecological research themes.

👉 Some code still retains the name *BirdTag*, reflecting the authentic origins of the system. This intentional mix shows how the project can flexibly adapt to different domains while keeping a robust technical foundation.

---

## 🎥 Demo Video
👉 [View Demo on Google Drive](https://drive.google.com/file/d/1UawWmEFmgT_LsmSkYWTTGzmihtUVSd9a/view?usp=sharing)

---

## 🚀 Features
- **Upload System** – drag & drop, progress tracking, Base64 conversion
- **Search Engine** – by tags, species, URL, or file similarity
- **Results Management** – filter, sort, bulk select, download, copy links
- **Tag Management** – AI-detected vs manual tags, bulk editing
- **Notifications** – subscribe to species, get email alerts (AWS SNS in full system)
- **Profile & Auth** – session management (AWS Cognito in full system)

---

## 🛠 Technical Overview
- **Frontend**: React 18 + TypeScript, React Router, custom hooks, responsive CSS
- **Backend (original)**: AWS S3, Lambda, Cognito, DynamoDB, SNS  
- **Demo Adaptation**: Mock APIs + local state, preserving RESTful interfaces for easy backend swap

📄 See [Technical Summary](./TECHNICAL_SUMMARY.md) for details  
📄 See [Design Rationale](./DESIGN_RATIONALE.md) for design process

---

## 📂 Project Structure
