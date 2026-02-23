# Edu-TVET V1.1
# Edu-TVET V1.1

EDU-TVET is a resource website that collects and shares vocational and technical education (TVET) materials intended for students, trainers, and industry partners. This repository stores content, lesson plans, project guides, and other learning materials used on the EDU-TVET website.

## Purpose
Provide easy access to practical, competency-focused TVET materials that educators can use in workshops and classrooms, and students can use for hands-on learning and exam preparation.

## What’s included
- Curriculum modules and syllabi
- Lesson plans and instructional guides
- Project and workshop guides with step-by-step instructions
- Assessment templates, rubrics, and competency checklists
- Video demonstrations and multimedia learning resources
- Metadata and organization files for website content

## Who this is for
- TVET students and learners
- Trainers, instructors, and curriculum developers
- Employers and technical partners involved in skills development

## How to use the materials
1. Browse folders by trade or subject area to find relevant modules.
2. Preview resources in your browser or download files for offline use.
3. Adapt lesson plans and assessments to your local curriculum and competency standards.
4. Cite the original source when reusing or adapting materials.

## Contributing
We welcome contributions from educators and practitioners.
- To propose a new resource: open a pull request with the new content, or create an issue to discuss larger changes.
- Follow the repository structure when adding files: group by trade/subject, then by resource type (e.g., lessons, assessments, videos).
- Add a short README inside each new folder describing the contents, author, and any licensing or usage notes.

Suggested contribution steps:
1. Fork the repository.
2. Add or update content in a new branch.
3. Create a pull request with a clear description of the changes and resources added.

## License
If you have a preferred license (e.g., CC BY 4.0 for educational resources or MIT for code), add a LICENSE file at the root and note it here. If not specified, please contact the repository owner for reuse permissions.

## Contact
Repository owner: edwayne6  
For inquiries, contributions, or partnerships, open an issue or contact the owner via GitHub.

## Roadmap / Next steps
- Organize materials by trade with clear tags and search metadata
- Add contributor guidelines and a templates folder for submissions
- Add automated checks for file naming and metadata completeness
- Publish a stable release of curated starter packs for common TVET trades

## Security, Privacy & AI usage
- Do not commit secrets: store API keys in a `.env` file and add `.env` to `.gitignore`.
- The server expects `OPENAI_API_KEY` for AI features. Keep this key private and rotate if exposed.
- AI endpoints are proxied through the backend to avoid exposing secrets to the browser.
- Rate limiting is enabled for all routes and stricter limits apply to AI endpoints to reduce abuse and costs.
- Uploaded document content is moderated before being accepted; flagged content will be rejected.
- Embeddings are stored in-memory for the prototype — for production, use a managed vector DB and control retention.
- Consider redacting personally-identifiable information (PII) from uploads before sending to external AI services.
- Monitor usage and costs from your AI provider and set quotas/budgets accordingly.

## Running locally (quick)
1. Create `.env` with:

```
OPENAI_API_KEY=sk-...
```

2. Install and run:

```bash
npm install
npm start
```

3. Open the admin UI at `http://localhost:5000` (or open `admin.html` via a server).

## Next recommended improvements
- ✅ Define AI features (summarize, search, chat)
- ✅ Add server AI endpoints
- ✅ Frontend UI controls (search, summarize, chat modal)
- ✅ Auto-moderation & approval workflow (basic moderation added)
- ✅ Security, privacy & docs (rate limiting, moderation, docs updated)
- 🔄 Semantic search & vector DB (in-memory implemented, persistent DB pending)
- 🔄 Document processing pipeline (OCR/text extraction implemented, full pipeline like auto-tags pending)
- ⏳ Analytics + anomaly detection (not started)
- Persist embeddings and chat history in a secure datastore (do not store raw user content without consent).
- Harden file upload checks (virus scanning, stricter mime checking).
- Add logging and alerting for suspicious activity and failed moderation.

Thank you for using and contributing to Edu-TVET — together we can make practical skills education more accessible.
