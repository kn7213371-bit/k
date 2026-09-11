import { createDB } from "../db.js";

const db = createDB();

export async function checkAuth(req, res, next) {
  /// get cookie
  const session_id = req.cookies.node_session_id;

  console.log("session", session_id);

  try {
    const sessions = await db.getAll("sessions");

    const session = sessions.find((s) => s.session_id == session_id);

    if (!session) {
      return res.status(401).json({
        error: "invalid token",
      });
    }

    req.current_user = session;

    /// if ok next()
    next();
  } catch {
    /// if not ok error
    return res.status(401).json({
      error: "invalid token",
    });
  }
}
