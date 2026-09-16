package models

// Project は projects テーブルのデータを表す構造体
type Project struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

// ProjectHome はプロジェクトホーム画面に必要な情報を表す構造体
type ProjectHome struct {
	Project Project            `json:"project"`
	Scenes  []ProjectHomeScene `json:"scenes"`
}

// ProjectHomeScene はプロジェクトホーム画面のシーン情報を表す構造体
type ProjectHomeScene struct {
	Scene          Scene                  `json:"scene"`
	RequiredCasts  []Cast                 `json:"required_casts"`
	Availabilities []SceneAvailabilityRow `json:"availabilities"`
}

// Cast は casts テーブルのデータを表す構造体
type Cast struct {
	ID        int    `json:"id"`
	ProjectID string `json:"project_id"`
	Name      string `json:"name"`
	RoleName  string `json:"role_name"`
	CreatedAt string `json:"created_at"`
}

// Scene は scenes テーブルのデータを表す構造体
type Scene struct {
	ID          int    `json:"id"`
	ProjectID   string `json:"project_id"`
	SceneName   string `json:"scene_name"`
	Description string `json:"description"`
}

// SceneAvailabilityRow はシーンごとの撮影可能日時を表す構造体
type SceneAvailabilityRow struct {
	SceneID    int    `json:"scene_id"`
	SceneName  string `json:"scene_name"`
	TargetDate string `json:"target_date"`
	TimeSlotID int    `json:"time_slot_id"`
	SlotName   string `json:"slot_name"`
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
}

// CandidateDate は candidate_dates テーブルのデータを表す構造体
type CandidateDate struct {
	ID         int    `json:"id"`
	ProjectID  string `json:"project_id"`
	TargetDate string `json:"target_date"`
}

// TimeSlotDef は time_slots_def テーブルのデータを表す構造体
type TimeSlotDef struct {
	ID        int    `json:"id"`
	ProjectID string `json:"project_id"`
	SlotName  string `json:"slot_name"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

// SceneAllowedTimeSlot は scene_allowed_time_slots テーブルのデータを表す構造体
type SceneAllowedTimeSlot struct {
	ID         int `json:"id"`
	SceneID    int `json:"scene_id"`
	TimeSlotID int `json:"time_slot_id"`
}

// SceneRequiredCast は scene_required_casts テーブルのデータを表す構造体
type SceneRequiredCast struct {
	ID      int `json:"id"`
	SceneID int `json:"scene_id"`
	CastID  int `json:"cast_id"`
}

// CastAvailability は cast_availabilities テーブルのデータを表す構造体
type CastAvailability struct {
	ID              int `json:"id"`
	CandidateDateID int `json:"candidate_date_id"`
	TimeSlotID      int `json:"time_slot_id"`
	CastID          int `json:"cast_id"`
	IsAvailable     int `json:"is_available"`
}
