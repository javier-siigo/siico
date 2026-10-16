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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anticipos_registros: {
        Row: {
          created_at: string
          created_by: string
          falta: Database["public"]["Enums"]["anticipos_falta_enum"]
          fecha_gestion: string | null
          fecha_rq: string
          id: string
          nombre: string
          nombre_normalizado: string | null
          observacion_1: Database["public"]["Enums"]["anticipos_observacion_1_enum"]
          observacion_2: string | null
          requerimiento: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          falta: Database["public"]["Enums"]["anticipos_falta_enum"]
          fecha_gestion?: string | null
          fecha_rq: string
          id?: string
          nombre: string
          observacion_1: Database["public"]["Enums"]["anticipos_observacion_1_enum"]
          observacion_2?: string | null
          requerimiento: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          falta?: Database["public"]["Enums"]["anticipos_falta_enum"]
          fecha_gestion?: string | null
          fecha_rq?: string
          id?: string
          nombre?: string
          observacion_1?: Database["public"]["Enums"]["anticipos_observacion_1_enum"]
          observacion_2?: string | null
          requerimiento?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      colaboradores_retirados: {
        Row: {
          cedula: number
          created_at: string
          fecha_reporte: string
          nombre: string
          nombre_normalizado: string | null
          observacion: string | null
          valor: number | null
        }
        Insert: {
          cedula: number
          created_at?: string
          fecha_reporte?: string
          nombre: string
          observacion?: string | null
          valor?: number | null
        }
        Update: {
          cedula?: number
          created_at?: string
          fecha_reporte?: string
          nombre?: string
          observacion?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      colaboradores_retirados_imports: {
        Row: {
          errors: number
          file_name: string
          file_size: number
          id: string
          imported_at: string
          imported_by: string | null
          total_rows: number
          upserted: number
        }
        Insert: {
          errors?: number
          file_name: string
          file_size: number
          id?: string
          imported_at?: string
          imported_by?: string | null
          total_rows: number
          upserted?: number
        }
        Update: {
          errors?: number
          file_name?: string
          file_size?: number
          id?: string
          imported_at?: string
          imported_by?: string | null
          total_rows?: number
          upserted?: number
        }
        Relationships: []
      }
      conciliacion_bancos: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          es_particular: boolean
          id: string
          nombre: string
          orden: number
          pais: string
          slug: string
          updated_at: string
          webhook_url: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          es_particular?: boolean
          id?: string
          nombre: string
          orden?: number
          pais: string
          slug: string
          updated_at?: string
          webhook_url: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          es_particular?: boolean
          id?: string
          nombre?: string
          orden?: number
          pais?: string
          slug?: string
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          paises: string[]
          roles: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          paises?: string[]
          roles?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          paises?: string[]
          roles?: string[]
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
      current_user_has_role: { Args: { check_role: string }; Returns: boolean }
      match_colaborador_retirado: {
        Args: { p_input: string }
        Returns: {
          cedula: number
          fecha_reporte: string
          nivel: string
          nombre: string
          observacion: string | null
          tokens_comunes: string[]
          tokens_extra: string[]
          valor: number | null
        }[]
      }
      match_colaborador_retirado_batch: {
        Args: { p_inputs: string[] }
        Returns: {
          cedula: number
          fecha_reporte: string
          nivel: string
          nombre: string
          observacion: string | null
          query: string
          tokens_comunes: string[]
          tokens_extra: string[]
          valor: number | null
        }[]
      }
      normalize_colaborador_name_unsorted: {
        Args: { n: string }
        Returns: string
      }
    }
    Enums: {
      anticipos_falta_enum:
        | "permisos_de_soportes"
        | "revisar_descuento_nomina"
        | "autorizacion_descuento_nomina"
        | "legalizado"
        | "revisar_soportes"
        | "devolucion"
        | "autorizacion_soportes"
        | "revisar_con_harold"
        | "soportes"
      anticipos_observacion_1_enum:
        | "no_se_ha_contactado"
        | "escrito_1_vez"
        | "escrito_2_veces"
        | "escrito_3_veces"
        | "legalizado"
        | "correo_al_lider"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : never

export const Constants = {
  public: {
    Enums: {
      anticipos_falta_enum: [
        "permisos_de_soportes",
        "revisar_descuento_nomina",
        "autorizacion_descuento_nomina",
        "legalizado",
        "revisar_soportes",
        "devolucion",
        "autorizacion_soportes",
        "revisar_con_harold",
        "soportes",
      ],
      anticipos_observacion_1_enum: [
        "no_se_ha_contactado",
        "escrito_1_vez",
        "escrito_2_veces",
        "escrito_3_veces",
        "legalizado",
        "correo_al_lider",
      ],
    },
  },
} as const