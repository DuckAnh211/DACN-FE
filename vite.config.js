import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: '/welcome.html'
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        add_question: resolve(__dirname, 'public/add_question.html'),
        add_test: resolve(__dirname, 'public/add_test.html'),
        call: resolve(__dirname, 'public/call.html'),
        classes_list: resolve(__dirname, 'public/classes_list.html'),
        classroom: resolve(__dirname, 'public/classroom.html'),
        home: resolve(__dirname, 'public/home.html'),
        intro: resolve(__dirname, 'public/intro.html'),
        login: resolve(__dirname, 'public/login.html'),
        profile_teacher: resolve(__dirname, 'public/profile-teacher.html'),
        profile: resolve(__dirname, 'public/profile.html'),
        signup: resolve(__dirname, 'public/signup.html'),
        teacher_class: resolve(__dirname, 'public/teacher_class.html'),
        videomeeting: resolve(__dirname, 'public/videomeeting.html'),
      }
    }
  },
   resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
