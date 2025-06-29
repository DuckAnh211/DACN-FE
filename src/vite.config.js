import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        add_question: resolve(__dirname, 'add_question.html'),
        add_test: resolve(__dirname, 'add_test.html'),
        call: resolve(__dirname, 'call.html'),
        classes_list: resolve(__dirname, 'classes_list.html'),
        classroom: resolve(__dirname, 'classroom.html'),
        home: resolve(__dirname, 'home.html'),
        intro: resolve(__dirname, 'intro.html'),
        login: resolve(__dirname, 'login.html'),
        profile_teacher: resolve(__dirname, 'profile-teacher.html'),
        profile: resolve(__dirname, 'profile.html'),
        signup: resolve(__dirname, 'signup.html'),
        teacher_class: resolve(__dirname, 'teacher_class.html'),
        videomeeting: resolve(__dirname, 'videomeeting.html'),
      }
    }
  }
});
