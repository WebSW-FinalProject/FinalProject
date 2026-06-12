// API 공통 베이스 URL
// 배포 시 : .env 파일에 VITE_API_BASE=https://your-server.com 설정
// 개발 시  : 자동으로 http://localhost:3000 사용
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3000';