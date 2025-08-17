import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and React DOM
          'react-vendor': ['react', 'react-dom'],
          
          // Split UI components into smaller chunks
          'radix-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-popover'
          ],
          'radix-extended': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-avatar',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog'
          ],
          'icons-animations': [
            'lucide-react',
            'framer-motion'
          ],
          
          // Router and state management
          'routing-state': [
            'react-router-dom',
            'zustand'
          ],
          
          // Form and validation
          'forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          
          // External services
          'services': [
            '@supabase/supabase-js'
          ],
          
          // Charts and data visualization
          'charts': [
            'recharts',
            'date-fns'
          ],
          
          // Utilities
          'utils': [
            'clsx',
            'tailwind-merge',
            'class-variance-authority'
          ]
        },
        
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('src/features/')) {
              return 'assets/features/[name]-[hash].js'
            }
            if (facadeModuleId.includes('src/components/')) {
              return 'assets/components/[name]-[hash].js'
            }
          }
          return 'assets/[name]-[hash].js'
        },
        
        // Optimize entry file names
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500,
    
    // Enable source maps only in development
    sourcemap: false,
    
    // Optimize target for modern browsers
    target: 'es2018',
    
    // Additional optimizations
    cssCodeSplit: true,
    cssMinify: true,
    assetsInlineLimit: 4096
  },
  
  // Optimize server for development
  server: {
    port: 3002,
    open: true
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
    ]
  },
  
  // Preview server settings
  preview: {
    port: 4173,
    open: true
  }
})