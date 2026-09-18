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
      bet_legs: {
        Row: {
          bet_id: string
          game_id: string
          id: string
          line_at_placement: number | null
          market: string
          odds_at_placement: number
          result: string
          selection: string
        }
        Insert: {
          bet_id: string
          game_id: string
          id?: string
          line_at_placement?: number | null
          market: string
          odds_at_placement: number
          result?: string
          selection: string
        }
        Update: {
          bet_id?: string
          game_id?: string
          id?: string
          line_at_placement?: number | null
          market?: string
          odds_at_placement?: number
          result?: string
          selection?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_legs_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_legs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          graded_at: string | null
          id: string
          payout: number | null
          placed_at: string
          status: string
          type: string
          user_id: string
          wager: number
        }
        Insert: {
          graded_at?: string | null
          id?: string
          payout?: number | null
          placed_at?: string
          status?: string
          type: string
          user_id: string
          wager: number
        }
        Update: {
          graded_at?: string | null
          id?: string
          payout?: number | null
          placed_at?: string
          status?: string
          type?: string
          user_id?: string
          wager?: number
        }
        Relationships: [
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_line_history: {
        Row: {
          game_id: string
          id: string
          moneyline_away: number | null
          moneyline_home: number | null
          recorded_at: string
          spread_line: number | null
          spread_odds: number | null
          total: number | null
          total_odds: number | null
        }
        Insert: {
          game_id: string
          id?: string
          moneyline_away?: number | null
          moneyline_home?: number | null
          recorded_at?: string
          spread_line?: number | null
          spread_odds?: number | null
          total?: number | null
          total_odds?: number | null
        }
        Update: {
          game_id?: string
          id?: string
          moneyline_away?: number | null
          moneyline_home?: number | null
          recorded_at?: string
          spread_line?: number | null
          spread_odds?: number | null
          total?: number | null
          total_odds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_line_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_score: number | null
          away_team: string
          away_team_id: string | null
          created_at: string
          home_score: number | null
          home_team: string
          home_team_id: string | null
          id: string
          kickoff_time: string
          last_odds_sync: string | null
          moneyline_away: number | null
          moneyline_home: number | null
          odds_api_event_id: string | null
          spread_line: number | null
          spread_odds: number | null
          status: string
          total: number | null
          total_odds: number | null
          week: number
        }
        Insert: {
          away_score?: number | null
          away_team: string
          away_team_id?: string | null
          created_at?: string
          home_score?: number | null
          home_team: string
          home_team_id?: string | null
          id?: string
          kickoff_time: string
          last_odds_sync?: string | null
          moneyline_away?: number | null
          moneyline_home?: number | null
          odds_api_event_id?: string | null
          spread_line?: number | null
          spread_odds?: number | null
          status?: string
          total?: number | null
          total_odds?: number | null
          week: number
        }
        Update: {
          away_score?: number | null
          away_team?: string
          away_team_id?: string | null
          created_at?: string
          home_score?: number | null
          home_team?: string
          home_team_id?: string | null
          id?: string
          kickoff_time?: string
          last_odds_sync?: string | null
          moneyline_away?: number | null
          moneyline_home?: number | null
          odds_api_event_id?: string | null
          spread_line?: number | null
          spread_odds?: number | null
          status?: string
          total?: number | null
          total_odds?: number | null
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      odds_api_quota_log: {
        Row: {
          checked_at: string
          id: string
          requests_remaining: number | null
          requests_used: number | null
          sync_type: string
        }
        Insert: {
          checked_at?: string
          id?: string
          requests_remaining?: number | null
          requests_used?: number | null
          sync_type: string
        }
        Update: {
          checked_at?: string
          id?: string
          requests_remaining?: number | null
          requests_used?: number | null
          sync_type?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          conference: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          conference: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          conference?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      toss_up_games: {
        Row: {
          game_id: string
          id: string
          week_id: string
        }
        Insert: {
          game_id: string
          id?: string
          week_id: string
        }
        Update: {
          game_id?: string
          id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toss_up_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toss_up_games_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "toss_up_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      toss_up_picks: {
        Row: {
          correct: boolean | null
          game_id: string
          id: string
          pick: string
          submitted_at: string
          user_id: string
          week_id: string
        }
        Insert: {
          correct?: boolean | null
          game_id: string
          id?: string
          pick: string
          submitted_at?: string
          user_id: string
          week_id: string
        }
        Update: {
          correct?: boolean | null
          game_id?: string
          id?: string
          pick?: string
          submitted_at?: string
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toss_up_picks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toss_up_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toss_up_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toss_up_picks_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "toss_up_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      toss_up_weeks: {
        Row: {
          bonus_amount: number
          bonus_awarded_at: string | null
          created_at: string
          id: string
          label: string
          lock_time: string
        }
        Insert: {
          bonus_amount?: number
          bonus_awarded_at?: string | null
          created_at?: string
          id?: string
          label: string
          lock_time: string
        }
        Update: {
          bonus_amount?: number
          bonus_awarded_at?: string | null
          created_at?: string
          id?: string
          label?: string
          lock_time?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          balance: number
          created_at: string
          id: string
          is_admin: boolean
          pin_hash: string
          username: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          is_admin?: boolean
          pin_hash: string
          username: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          is_admin?: boolean
          pin_hash?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string | null
          is_admin: boolean | null
          username: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string | null
          is_admin?: boolean | null
          username?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string | null
          is_admin?: boolean | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      place_bet: {
        Args: {
          p_legs: Json
          p_type: string
          p_user_id: string
          p_wager: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
