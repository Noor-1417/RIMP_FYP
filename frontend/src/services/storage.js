import api from './api';

async function getPresigned(filename, contentType) {
  const res = await api.post('/storage/presigned', { filename, contentType });
  return res.data || res;
}

async function uploadFileToPresigned(presignedUrl, file) {
  // PUT the file to the presigned URL
  const resp = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });
  if (!resp.ok) throw new Error('Upload failed');
  return true;
}

export const storageService = {
  getPresigned,
  uploadFileToPresigned,
};

export default storageService;
