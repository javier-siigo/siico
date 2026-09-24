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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
