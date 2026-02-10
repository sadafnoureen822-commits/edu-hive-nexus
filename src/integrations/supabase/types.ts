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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      institution_role: "admin" | "teacher" | "student"
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
      institution_role: ["admin", "teacher", "student"],
      institution_status: ["active", "suspended", "pending"],
      platform_role: ["platform_admin"],
    },
  },
} as const
