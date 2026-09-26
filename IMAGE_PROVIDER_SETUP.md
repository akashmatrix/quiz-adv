# Free AI Image Generation Setup

This version keeps Gemini for quiz-question generation and replaces Gemini image generation with Hugging Face Inference Providers.

## 1. Create a Hugging Face token

Create a Hugging Face account and create a User Access Token with permission to use Inference Providers.

Set it in `backend/.env`:

```env
HF_TOKEN=hf_your_token_here
HF_IMAGE_PROVIDER=hf-inference
HF_IMAGE_MODEL=stabilityai/stable-diffusion-3-medium-diffusers
```

Keep your existing Gemini variables:

```env
GEMINI_API_KEY=your_existing_gemini_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

## 2. Restart the backend

```bash
cd backend
npm start
```

No new npm package is required for the image provider. The backend uses Node's built-in `fetch`.

## 3. Test

Open the quiz creator, edit a question, choose **AI Generate Image**, and generate an image.

The backend stores the returned image in the existing MongoDB GridFS `quizImages` bucket and returns the same `/api/images/:id` URL format used by manual uploads.

## Important free-tier note

Hugging Face currently gives Free users a small monthly Inference Providers credit allocation ($0.10 at the time this project was updated). It is suitable for testing, but it is not unlimited free image generation. If the free credits are exhausted, the API can return a billing/quota error. The app converts common authentication, quota, and rate-limit failures into user-friendly messages.
