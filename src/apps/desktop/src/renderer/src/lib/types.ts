/**
 * 页面用的类型别名。
 *
 * 数据现在来自主进程的读模型（@core 的 *View），但页面里到处写的是
 * Job / Candidate / ApplicationRow 这些名字，这里做一层别名，
 * 免得为了换个数据源把几十处类型标注全改一遍。
 */
export type {
  ApplicationLogView as ApplicationLog,
  ApplicationView as ApplicationRow,
  CandidateView as Candidate,
  ConversationView as Conversation,
  InterviewView as Interview,
  JobMatchView as JobMatch,
  JobView as Job,
  LlmUsageView as LlmUsage,
  SavedViewView as SavedView,
  SourceView as SourceRow
} from '@core'
