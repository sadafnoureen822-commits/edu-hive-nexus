export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_sessions: {
        Row: {
          academic_model: Database["public"]["Enums"]["academic_model"]
          created_at: string
          end_date: string
          id: string
          institution_id: string
          is_current: boolean
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          academic_model?: Database["public"]["Enums"]["academic_model"]
          created_at?: string
          end_date: string
          id?: string
          institution_id: string
          is_current?: boolean
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          academic_model?: Database["public"]["Enums"]["academic_model"]
          created_at?: string
          end_date?: string
          id?: string
          institution_id?: string
          is_current?: boolean
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_sessions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          institution_id: string | null
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          institution_id?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          institution_id?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_applications: {
        Row: {
          address: string | null
          application_number: string | null
          applying_for_class: string | null
          created_at: string
          date_of_birth: string | null
          documents: Json | null
          email: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          guardian_phone: string | null
          id: string
          institution_id: string
          mother_name: string | null
          notes: string | null
          phone: string | null
          previous_grade: string | null
          previous_school: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          application_number?: string | null
          applying_for_class?: string | null
          created_at?: string
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          guardian_phone?: string | null
          id?: string
          institution_id: string
          mother_name?: string | null
          notes?: string | null
          phone?: string | null
          previous_grade?: string | null
          previous_school?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          application_number?: string | null
          applying_for_class?: string | null
          created_at?: string
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          guardian_phone?: string | null
          id?: string
          institution_id?: string
          mother_name?: string | null
          notes?: string | null
          phone?: string | null
          previous_grade?: string | null
          previous_school?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_applications_applying_for_class_fkey"
            columns: ["applying_for_class"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_applications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          attachment_url: string | null
          audience: string[] | null
          class_ids: string[] | null
          content: string
          created_at: string
          created_by: string | null
          expire_date: string | null
          id: string
          institution_id: string
          is_pinned: boolean
          is_published: boolean
          publish_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          audience?: string[] | null
          class_ids?: string[] | null
          content: string
          created_at?: string
          created_by?: string | null
          expire_date?: string | null
          id?: string
          institution_id: string
          is_pinned?: boolean
          is_published?: boolean
          publish_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          audience?: string[] | null
          class_ids?: string[] | null
          content?: string
          created_at?: string
          created_by?: string | null
          expire_date?: string | null
          id?: string
          institution_id?: string
          is_pinned?: boolean
          is_published?: boolean
          publish_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          institution_id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          institution_id: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          institution_id: string
          marks_obtained: number | null
          notes: string | null
          status: string
          student_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          institution_id: string
          marks_obtained?: number | null
          notes?: string | null
          status?: string
          student_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          institution_id?: string
          marks_obtained?: number | null
          notes?: string | null
          status?: string
          student_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          institution_id: string
          instructions: string | null
          passing_marks: number
          status: string
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          institution_id: string
          instructions?: string | null
          passing_marks?: number
          status?: string
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          institution_id?: string
          instructions?: string | null
          passing_marks?: number
          status?: string
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string | null
          created_at: string
          date: string
          id: string
          institution_id: string
          marked_by: string | null
          notes: string | null
          section_id: string | null
          status: string
          student_id: string
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date: string
          id?: string
          institution_id: string
          marked_by?: string | null
          notes?: string | null
          section_id?: string | null
          status?: string
          student_id: string
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          institution_id?: string
          marked_by?: string | null
          notes?: string | null
          section_id?: string | null
          status?: string
          student_id?: string
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          background_url: string | null
          created_at: string
          fields: Json | null
          id: string
          institution_id: string
          is_active: boolean
          logo_url: string | null
          name: string
          signature_urls: Json | null
          template_html: string | null
          template_type: string
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          created_at?: string
          fields?: Json | null
          id?: string
          institution_id: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          signature_urls?: Json | null
          template_html?: string | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          created_at?: string
          fields?: Json | null
          id?: string
          institution_id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          signature_urls?: Json | null
          template_html?: string | null
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          institution_id: string
          is_active: boolean
          name: string
          numeric_level: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          institution_id: string
          is_active?: boolean
          name: string
          numeric_level?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean
          name?: string
          numeric_level?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_blocks: {
        Row: {
          block_type: Database["public"]["Enums"]["cms_block_type"]
          content: Json
          created_at: string
          id: string
          institution_id: string
          position: number
          section_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          block_type: Database["public"]["Enums"]["cms_block_type"]
          content?: Json
          created_at?: string
          id?: string
          institution_id: string
          position?: number
          section_id: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          block_type?: Database["public"]["Enums"]["cms_block_type"]
          content?: Json
          created_at?: string
          id?: string
          institution_id?: string
          position?: number
          section_id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_blocks_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_blocks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "cms_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          institution_id: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          folder_id?: string | null
          id?: string
          institution_id: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          institution_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "cms_media_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_media_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media_folders: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_folders_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_menu_items: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          label: string
          link_type: Database["public"]["Enums"]["cms_link_type"]
          link_url: string | null
          menu_id: string
          page_id: string | null
          parent_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          label: string
          link_type?: Database["public"]["Enums"]["cms_link_type"]
          link_url?: string | null
          menu_id: string
          page_id?: string | null
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          label?: string
          link_type?: Database["public"]["Enums"]["cms_link_type"]
          link_url?: string | null
          menu_id?: string
          page_id?: string | null
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_menu_items_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "cms_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_menu_items_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_menus: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          menu_type: Database["public"]["Enums"]["cms_menu_type"]
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          menu_type: Database["public"]["Enums"]["cms_menu_type"]
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          menu_type?: Database["public"]["Enums"]["cms_menu_type"]
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_menus_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_page_versions: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          institution_id: string
          page_id: string
          version_number: number
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id: string
          page_id: string
          version_number?: number
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id?: string
          page_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_page_versions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          institution_id: string
          is_system_page: boolean
          meta_description: string | null
          page_type: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["cms_page_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id: string
          is_system_page?: boolean
          meta_description?: string | null
          page_type?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["cms_page_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id?: string
          is_system_page?: boolean
          meta_description?: string | null
          page_type?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["cms_page_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_sections: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          is_visible: boolean
          page_id: string
          position: number
          section_type: Database["public"]["Enums"]["cms_section_type"]
          settings: Json
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          is_visible?: boolean
          page_id: string
          position?: number
          section_type: Database["public"]["Enums"]["cms_section_type"]
          settings?: Json
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          is_visible?: boolean
          page_id?: string
          position?: number
          section_type?: Database["public"]["Enums"]["cms_section_type"]
          settings?: Json
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_sections_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_site_settings: {
        Row: {
          analytics_code: string | null
          created_at: string
          custom_css: string | null
          favicon_url: string | null
          font_family: string | null
          id: string
          institution_id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          site_title: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          analytics_code?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          institution_id: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          site_title?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          analytics_code?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          institution_id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          site_title?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_site_settings_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: true
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          institution_id: string
          status: string
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          institution_id: string
          status?: string
          student_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          institution_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          duration_minutes: number | null
          file_url: string | null
          id: string
          institution_id: string
          is_published: boolean
          position: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          institution_id: string
          is_published?: boolean
          position?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          institution_id?: string
          is_published?: boolean
          position?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          institution_id: string
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id: string
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          audience: string | null
          body: string | null
          error_message: string | null
          id: string
          institution_id: string
          message_id: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string
          sent_by: string | null
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          audience?: string | null
          body?: string | null
          error_message?: string | null
          id?: string
          institution_id: string
          message_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject: string
          template_id?: string | null
        }
        Update: {
          audience?: string | null
          body?: string | null
          error_message?: string | null
          id?: string
          institution_id?: string
          message_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_date_sheets: {
        Row: {
          created_at: string
          end_time: string | null
          exam_date: string
          exam_subject_id: string
          id: string
          institution_id: string
          location: string | null
          notes: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          exam_date: string
          exam_subject_id: string
          id?: string
          institution_id: string
          location?: string | null
          notes?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          exam_date?: string
          exam_subject_id?: string
          id?: string
          institution_id?: string
          location?: string | null
          notes?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_date_sheets_exam_subject_id_fkey"
            columns: ["exam_subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_date_sheets_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_subjects: {
        Row: {
          created_at: string
          exam_id: string
          grace_marks: number | null
          id: string
          institution_id: string
          passing_marks: number
          practical_weightage: number
          subject_id: string
          theory_weightage: number
          total_marks: number
          updated_at: string
          viva_weightage: number
        }
        Insert: {
          created_at?: string
          exam_id: string
          grace_marks?: number | null
          id?: string
          institution_id: string
          passing_marks?: number
          practical_weightage?: number
          subject_id: string
          theory_weightage?: number
          total_marks?: number
          updated_at?: string
          viva_weightage?: number
        }
        Update: {
          created_at?: string
          exam_id?: string
          grace_marks?: number | null
          id?: string
          institution_id?: string
          passing_marks?: number
          practical_weightage?: number
          subject_id?: string
          theory_weightage?: number
          total_marks?: number
          updated_at?: string
          viva_weightage?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          exam_type: Database["public"]["Enums"]["academic_model"]
          grading_scale_id: string | null
          id: string
          institution_id: string
          name: string
          section_id: string | null
          session_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["exam_status"]
          term_number: number | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          exam_type: Database["public"]["Enums"]["academic_model"]
          grading_scale_id?: string | null
          id?: string
          institution_id: string
          name: string
          section_id?: string | null
          session_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["exam_status"]
          term_number?: number | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          exam_type?: Database["public"]["Enums"]["academic_model"]
          grading_scale_id?: string | null
          id?: string
          institution_id?: string
          name?: string
          section_id?: string | null
          session_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["exam_status"]
          term_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_grading_scale_id_fkey"
            columns: ["grading_scale_id"]
            isOneToOne: false
            referencedRelation: "grading_scales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount_due: number
          amount_paid: number
          collected_by: string | null
          created_at: string
          discount: number | null
          due_date: string | null
          fee_structure_id: string | null
          fine: number | null
          id: string
          institution_id: string
          month_year: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          receipt_number: string | null
          status: string
          student_id: string
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          collected_by?: string | null
          created_at?: string
          discount?: number | null
          due_date?: string | null
          fee_structure_id?: string | null
          fine?: number | null
          id?: string
          institution_id: string
          month_year?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: string
          student_id: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          collected_by?: string | null
          created_at?: string
          discount?: number | null
          due_date?: string | null
          fee_structure_id?: string | null
          fine?: number | null
          id?: string
          institution_id?: string
          month_year?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: string
          student_id?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          amount: number
          class_id: string | null
          created_at: string
          description: string | null
          due_day: number | null
          fee_type: string
          id: string
          institution_id: string
          is_active: boolean
          late_fee: number | null
          name: string
          session_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          class_id?: string | null
          created_at?: string
          description?: string | null
          due_day?: number | null
          fee_type?: string
          id?: string
          institution_id: string
          is_active?: boolean
          late_fee?: number | null
          name: string
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          class_id?: string | null
          created_at?: string
          description?: string | null
          due_day?: number | null
          fee_type?: string
          id?: string
          institution_id?: string
          is_active?: boolean
          late_fee?: number | null
          name?: string
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_scale_entries: {
        Row: {
          created_at: string
          description: string | null
          gpa_points: number | null
          grade_letter: string
          id: string
          institution_id: string
          max_percentage: number
          min_percentage: number
          scale_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gpa_points?: number | null
          grade_letter: string
          id?: string
          institution_id: string
          max_percentage: number
          min_percentage: number
          scale_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gpa_points?: number | null
          grade_letter?: string
          id?: string
          institution_id?: string
          max_percentage?: number
          min_percentage?: number
          scale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_scale_entries_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_scale_entries_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "grading_scales"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_scales: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_scales_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          institution_id: string
          is_primary: boolean
          status: Database["public"]["Enums"]["domain_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          institution_id: string
          is_primary?: boolean
          status?: Database["public"]["Enums"]["domain_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          institution_id?: string
          is_primary?: boolean
          status?: Database["public"]["Enums"]["domain_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_domains_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_members: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["institution_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["institution_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["institution_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_members_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_modules: {
        Row: {
          id: string
          institution_id: string
          is_enabled: boolean
          module_name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          is_enabled?: boolean
          module_name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          is_enabled?: boolean
          module_name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_modules_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_subscriptions: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          institution_id: string
          notes: string | null
          plan_id: string | null
          status: string
          suspended_at: string | null
          suspension_reason: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          institution_id: string
          notes?: string | null
          plan_id?: string | null
          status?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          institution_id?: string
          notes?: string | null
          plan_id?: string | null
          status?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_subscriptions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: true
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["institution_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["institution_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["institution_status"]
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string
          currency: string
          due_date: string | null
          id: string
          institution_id: string
          invoice_number: string
          line_items: Json | null
          notes: string | null
          paid_at: string | null
          status: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          institution_id: string
          invoice_number: string
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          institution_id?: string
          invoice_number?: string
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "institution_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      issued_certificates: {
        Row: {
          certificate_data: Json | null
          id: string
          institution_id: string
          is_revoked: boolean
          issued_at: string
          revoked_at: string | null
          serial_number: string
          student_id: string
          template_id: string
        }
        Insert: {
          certificate_data?: Json | null
          id?: string
          institution_id: string
          is_revoked?: boolean
          issued_at?: string
          revoked_at?: string | null
          serial_number: string
          student_id: string
          template_id: string
        }
        Update: {
          certificate_data?: Json | null
          id?: string
          institution_id?: string
          is_revoked?: boolean
          issued_at?: string
          revoked_at?: string | null
          serial_number?: string
          student_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issued_certificates_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          institution_id: string
          is_completed: boolean
          lesson_id: string
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          institution_id: string
          is_completed?: boolean
          lesson_id: string
          student_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          institution_id?: string
          is_completed?: boolean
          lesson_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          action: string
          created_at: string
          email: string | null
          failure_reason: string | null
          id: string
          institution_id: string | null
          ip_address: string | null
          location: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          email?: string | null
          failure_reason?: string | null
          id?: string
          institution_id?: string | null
          ip_address?: string | null
          location?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          email?: string | null
          failure_reason?: string | null
          id?: string
          institution_id?: string | null
          ip_address?: string | null
          location?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          institution_id: string
          is_read: boolean
          message: string
          metadata: Json | null
          read_at: string | null
          recipient_id: string
          sender_id: string | null
          title: string
          type: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          institution_id: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          read_at?: string | null
          recipient_id: string
          sender_id?: string | null
          title: string
          type?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          institution_id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_links: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          parent_user_id: string
          relationship: string | null
          student_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          parent_user_id: string
          relationship?: string | null
          student_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          parent_user_id?: string
          relationship?: string | null
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          institution_id: string
          invoice_id: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          recorded_by: string | null
          status: string
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          institution_id: string
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          status?: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          institution_id?: string
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          status?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          attempt_id: string
          id: string
          institution_id: string
          is_correct: boolean | null
          marks_awarded: number | null
          question_id: string
          selected_option_id: string | null
          text_answer: string | null
        }
        Insert: {
          attempt_id: string
          id?: string
          institution_id: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id: string
          selected_option_id?: string | null
          text_answer?: string | null
        }
        Update: {
          attempt_id?: string
          id?: string
          institution_id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id?: string
          selected_option_id?: string | null
          text_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "quiz_options"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          institution_id: string
          marks_obtained: number | null
          percentage: number | null
          quiz_id: string
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          time_taken_seconds: number | null
        }
        Insert: {
          id?: string
          institution_id: string
          marks_obtained?: number | null
          percentage?: number | null
          quiz_id: string
          started_at?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
        }
        Update: {
          id?: string
          institution_id?: string
          marks_obtained?: number | null
          percentage?: number | null
          quiz_id?: string
          started_at?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          id: string
          institution_id: string
          is_correct: boolean
          option_text: string
          position: number
          question_id: string
        }
        Insert: {
          id?: string
          institution_id: string
          is_correct?: boolean
          option_text: string
          position?: number
          question_id: string
        }
        Update: {
          id?: string
          institution_id?: string
          is_correct?: boolean
          option_text?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          institution_id: string
          marks: number
          position: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          institution_id: string
          marks?: number
          position?: number
          question_text: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          institution_id?: string
          marks?: number
          position?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          institution_id: string
          max_attempts: number
          passing_marks: number
          status: string
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          institution_id: string
          max_attempts?: number
          passing_marks?: number
          status?: string
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          institution_id?: string
          max_attempts?: number
          passing_marks?: number
          status?: string
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          class_id: string
          created_at: string
          id: string
          institution_id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          institution_id: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          institution_id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          audience: string | null
          cost: number | null
          error_message: string | null
          id: string
          institution_id: string
          message: string
          message_id: string | null
          recipient_name: string | null
          recipient_phone: string
          sent_at: string
          sent_by: string | null
          status: string
        }
        Insert: {
          audience?: string | null
          cost?: number | null
          error_message?: string | null
          id?: string
          institution_id: string
          message: string
          message_id?: string | null
          recipient_name?: string | null
          recipient_phone: string
          sent_at?: string
          sent_by?: string | null
          status?: string
        }
        Update: {
          audience?: string | null
          cost?: number | null
          error_message?: string | null
          id?: string
          institution_id?: string
          message?: string
          message_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          sent_at?: string
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_marks: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          exam_id: string | null
          exam_subject_id: string
          grace_marks_applied: number | null
          id: string
          institution_id: string
          is_absent: boolean
          practical_marks: number | null
          rejection_reason: string | null
          remarks: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          submitted_at: string | null
          submitted_by: string | null
          theory_marks: number | null
          total_marks: number | null
          total_obtained: number | null
          updated_at: string
          viva_marks: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          exam_id?: string | null
          exam_subject_id: string
          grace_marks_applied?: number | null
          id?: string
          institution_id: string
          is_absent?: boolean
          practical_marks?: number | null
          rejection_reason?: string | null
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          submitted_at?: string | null
          submitted_by?: string | null
          theory_marks?: number | null
          total_marks?: number | null
          total_obtained?: number | null
          updated_at?: string
          viva_marks?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          exam_id?: string | null
          exam_subject_id?: string
          grace_marks_applied?: number | null
          id?: string
          institution_id?: string
          is_absent?: boolean
          practical_marks?: number | null
          rejection_reason?: string | null
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          theory_marks?: number | null
          total_marks?: number | null
          total_obtained?: number | null
          updated_at?: string
          viva_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_marks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_marks_exam_subject_id_fkey"
            columns: ["exam_subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_marks_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          address: string | null
          admission_date: string | null
          blood_group: string | null
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact: string | null
          father_name: string | null
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          institution_id: string
          is_active: boolean
          mother_name: string | null
          phone: string | null
          photo_url: string | null
          roll_number: string | null
          section_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          father_name?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          institution_id: string
          is_active?: boolean
          mother_name?: string | null
          phone?: string | null
          photo_url?: string | null
          roll_number?: string | null
          section_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          father_name?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean
          mother_name?: string | null
          phone?: string | null
          photo_url?: string | null
          roll_number?: string | null
          section_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      student_promotions: {
        Row: {
          created_at: string
          from_class_id: string
          from_section_id: string | null
          from_session_id: string
          id: string
          institution_id: string
          promoted_at: string
          promoted_by: string | null
          promotion_type: string
          remarks: string | null
          student_id: string
          to_class_id: string
          to_section_id: string | null
          to_session_id: string
        }
        Insert: {
          created_at?: string
          from_class_id: string
          from_section_id?: string | null
          from_session_id: string
          id?: string
          institution_id: string
          promoted_at?: string
          promoted_by?: string | null
          promotion_type?: string
          remarks?: string | null
          student_id: string
          to_class_id: string
          to_section_id?: string | null
          to_session_id: string
        }
        Update: {
          created_at?: string
          from_class_id?: string
          from_section_id?: string | null
          from_session_id?: string
          id?: string
          institution_id?: string
          promoted_at?: string
          promoted_by?: string | null
          promotion_type?: string
          remarks?: string | null
          student_id?: string
          to_class_id?: string
          to_section_id?: string | null
          to_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_promotions_from_class_id_fkey"
            columns: ["from_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_from_section_id_fkey"
            columns: ["from_section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_from_session_id_fkey"
            columns: ["from_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_to_class_id_fkey"
            columns: ["to_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_to_section_id_fkey"
            columns: ["to_section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_to_session_id_fkey"
            columns: ["to_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          institution_id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institution_id: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          is_trial: boolean
          max_storage_gb: number | null
          max_students: number | null
          max_teachers: number | null
          name: string
          price_monthly: number
          price_yearly: number
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_trial?: boolean
          max_storage_gb?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_trial?: boolean
          max_storage_gb?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          designation: string | null
          employee_id: string | null
          gender: string | null
          id: string
          institution_id: string
          is_active: boolean
          joining_date: string | null
          phone: string | null
          photo_url: string | null
          qualifications: string | null
          salary: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          employee_id?: string | null
          gender?: string | null
          id?: string
          institution_id: string
          is_active?: boolean
          joining_date?: string | null
          phone?: string | null
          photo_url?: string | null
          qualifications?: string | null
          salary?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          employee_id?: string | null
          gender?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean
          joining_date?: string | null
          phone?: string | null
          photo_url?: string | null
          qualifications?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          institution_id: string
          is_active: boolean
          room: string | null
          section_id: string | null
          session_id: string
          start_time: string
          subject_id: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          institution_id: string
          is_active?: boolean
          room?: string | null
          section_id?: string | null
          session_id: string
          start_time: string
          subject_id: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          institution_id?: string
          is_active?: boolean
          room?: string | null
          section_id?: string | null
          session_id?: string
          start_time?: string
          subject_id?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetables_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_records: {
        Row: {
          certificate_id: string
          id: string
          institution_id: string
          ip_address: string | null
          result: string
          user_agent: string | null
          verified_at: string
          verifier_name: string | null
          verifier_org: string | null
        }
        Insert: {
          certificate_id: string
          id?: string
          institution_id: string
          ip_address?: string | null
          result?: string
          user_agent?: string | null
          verified_at?: string
          verifier_name?: string | null
          verifier_org?: string | null
        }
        Update: {
          certificate_id?: string
          id?: string
          institution_id?: string
          ip_address?: string | null
          result?: string
          user_agent?: string | null
          verified_at?: string
          verifier_name?: string | null
          verifier_org?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_records_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "issued_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_records_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          audience: string | null
          created_at: string
          error_message: string | null
          id: string
          institution_id: string
          message: string
          message_id: string | null
          recipient_name: string | null
          recipient_phone: string
          sent_by: string | null
          status: string
        }
        Insert: {
          audience?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          institution_id: string
          message: string
          message_id?: string | null
          recipient_name?: string | null
          recipient_phone: string
          sent_by?: string | null
          status?: string
        }
        Update: {
          audience?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          institution_id?: string
          message?: string
          message_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_grade: {
        Args: { percentage: number; scale_id: string }
        Returns: {
          description: string
          gpa_points: number
          grade_letter: string
        }[]
      }
      generate_certificate_serial: {
        Args: { institution_id: string; template_type: string }
        Returns: string
      }
      generate_invoice_number: {
        Args: { p_institution_id: string }
        Returns: string
      }
      get_user_institution_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      is_institution_admin: {
        Args: { _institution_id: string; _user_id: string }
        Returns: boolean
      }
      is_institution_member: {
        Args: { _institution_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      academic_model: "annual" | "term" | "semester"
      approval_status:
        | "draft"
        | "submitted"
        | "reviewed"
        | "approved"
        | "rejected"
      cms_block_type:
        | "text"
        | "image"
        | "button"
        | "heading"
        | "video"
        | "divider"
        | "spacer"
        | "html"
        | "icon"
      cms_link_type: "internal" | "external"
      cms_menu_type: "header" | "footer"
      cms_page_status: "draft" | "published" | "archived"
      cms_section_type:
        | "hero_banner"
        | "about"
        | "programs"
        | "admission_cta"
        | "testimonials"
        | "statistics"
        | "gallery"
        | "notice_board"
        | "contact"
        | "custom_html"
      domain_status: "active" | "inactive" | "pending_verification"
      exam_status: "draft" | "scheduled" | "active" | "completed" | "cancelled"
      institution_role:
        | "admin"
        | "teacher"
        | "student"
        | "exam_controller"
        | "principal"
        | "parent"
      institution_status: "active" | "suspended" | "pending"
      platform_role: "platform_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      academic_model: ["annual", "term", "semester"],
      approval_status: [
        "draft",
        "submitted",
        "reviewed",
        "approved",
        "rejected",
      ],
      cms_block_type: [
        "text",
        "image",
        "button",
        "heading",
        "video",
        "divider",
        "spacer",
        "html",
        "icon",
      ],
      cms_link_type: ["internal", "external"],
      cms_menu_type: ["header", "footer"],
      cms_page_status: ["draft", "published", "archived"],
      cms_section_type: [
        "hero_banner",
        "about",
        "programs",
        "admission_cta",
        "testimonials",
        "statistics",
        "gallery",
        "notice_board",
        "contact",
        "custom_html",
      ],
      domain_status: ["active", "inactive", "pending_verification"],
      exam_status: ["draft", "scheduled", "active", "completed", "cancelled"],
      institution_role: [
        "admin",
        "teacher",
        "student",
        "exam_controller",
        "principal",
        "parent",
      ],
      institution_status: ["active", "suspended", "pending"],
      platform_role: ["platform_admin"],
    },
  },
} as const
