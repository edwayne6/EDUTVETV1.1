const db = require('./database');

// Content Recommendation Engine
class RecommendationEngine {
  constructor() {
    this.db = db;
  }

  // Track user interactions for learning patterns
  async trackInteraction(userId, documentId, interactionType, metadata = {}) {
    try {
      const timestamp = new Date().toISOString();

      // Store interaction in a new table (we'll need to create this)
      await this.ensureInteractionTable();

      const stmt = this.db.db.prepare(`
        INSERT OR REPLACE INTO user_interactions
        (user_id, document_id, interaction_type, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?)
      `);

      await new Promise((resolve, reject) => {
        stmt.run([userId, documentId, interactionType, timestamp, JSON.stringify(metadata)], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });

      stmt.finalize();
      return { success: true };
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Ensure interaction tracking table exists
  async ensureInteractionTable() {
    return new Promise((resolve, reject) => {
      this.db.db.run(`
        CREATE TABLE IF NOT EXISTS user_interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          document_id INTEGER NOT NULL,
          interaction_type TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT,
          UNIQUE(user_id, document_id, interaction_type)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Get recommendations for a user
  async getRecommendations(userId, limit = 10) {
    try {
      const recommendations = [];

      // 1. Content-based recommendations (similar department/level)
      const contentBased = await this.getContentBasedRecommendations(userId, limit);
      recommendations.push(...contentBased);

      // 2. Collaborative filtering (users with similar interests)
      const collaborative = await this.getCollaborativeRecommendations(userId, limit);
      recommendations.push(...collaborative);

      // 3. Popularity-based recommendations (trending in department)
      const popular = await this.getPopularRecommendations(userId, limit);
      recommendations.push(...popular);

      // 4. Sequential learning recommendations (next level in same department)
      const sequential = await this.getSequentialRecommendations(userId, limit);
      recommendations.push(...sequential);

      // Remove duplicates and limit results
      const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
      return uniqueRecommendations.slice(0, limit);

    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  // Content-based recommendations (similar department/level)
  async getContentBasedRecommendations(userId, limit) {
    try {
      // Get user's interaction history
      const userHistory = await this.getUserInteractionHistory(userId);

      if (userHistory.length === 0) {
        return await this.getPopularDocuments(limit);
      }

      // Find most interacted departments and levels
      const departmentCounts = {};
      const levelCounts = {};

      userHistory.forEach(interaction => {
        if (interaction.department) {
          departmentCounts[interaction.department] = (departmentCounts[interaction.department] || 0) + 1;
        }
        if (interaction.level) {
          levelCounts[interaction.level] = (levelCounts[interaction.level] || 0) + 1;
        }
      });

      const topDepartment = Object.keys(departmentCounts).reduce((a, b) =>
        departmentCounts[a] > departmentCounts[b] ? a : b, null);

      const topLevel = Object.keys(levelCounts).reduce((a, b) =>
        levelCounts[a] > levelCounts[b] ? a : b, null);

      // Find documents in same department but not interacted with
      const recommendations = await new Promise((resolve, reject) => {
        let query = `
          SELECT d.*, COUNT(ui.id) as interaction_count
          FROM documents d
          LEFT JOIN user_interactions ui ON d.id = ui.document_id AND ui.user_id = ?
          WHERE d.status = 'published'
          AND ui.id IS NULL
        `;
        const params = [userId];

        if (topDepartment) {
          query += ` AND d.department = ?`;
          params.push(topDepartment);
        }

        query += ` ORDER BY d.date DESC LIMIT ?`;
        params.push(limit);

        this.db.db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            ...row,
            recommendation_reason: `Similar to your interests in ${topDepartment}`,
            confidence_score: 0.8
          })));
        });
      });

      return recommendations;
    } catch (error) {
      console.error('Error in content-based recommendations:', error);
      return [];
    }
  }

  // Collaborative filtering recommendations
  async getCollaborativeRecommendations(userId, limit) {
    try {
      // Find users with similar interaction patterns
      const similarUsers = await this.findSimilarUsers(userId);

      if (similarUsers.length === 0) {
        return [];
      }

      // Get documents that similar users interacted with but current user hasn't
      const userIds = similarUsers.map(u => u.user_id);
      const recommendations = await new Promise((resolve, reject) => {
        this.db.db.all(`
          SELECT d.*,
                 COUNT(DISTINCT ui.user_id) as similar_user_count,
                 AVG(CASE WHEN ui.interaction_type = 'download' THEN 2
                          WHEN ui.interaction_type = 'view' THEN 1
                          ELSE 0.5 END) as avg_interaction_score
          FROM documents d
          INNER JOIN user_interactions ui ON d.id = ui.document_id
          LEFT JOIN user_interactions user_ui ON d.id = user_ui.document_id AND user_ui.user_id = ?
          WHERE ui.user_id IN (${userIds.map(() => '?').join(',')})
          AND d.status = 'published'
          AND user_ui.id IS NULL
          GROUP BY d.id
          ORDER BY avg_interaction_score DESC, similar_user_count DESC
          LIMIT ?
        `, [userId, ...userIds, limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            ...row,
            recommendation_reason: `Popular among users with similar interests`,
            confidence_score: Math.min(row.avg_interaction_score / 2, 0.9)
          })));
        });
      });

      return recommendations;
    } catch (error) {
      console.error('Error in collaborative recommendations:', error);
      return [];
    }
  }

  // Popular recommendations (trending content)
  async getPopularRecommendations(userId, limit) {
    try {
      const recommendations = await new Promise((resolve, reject) => {
        this.db.db.all(`
          SELECT d.*,
                 COUNT(ui.id) as total_interactions,
                 COUNT(CASE WHEN ui.interaction_type = 'download' THEN 1 END) as downloads,
                 COUNT(DISTINCT ui.user_id) as unique_users
          FROM documents d
          LEFT JOIN user_interactions ui ON d.id = ui.document_id
          LEFT JOIN user_interactions user_ui ON d.id = user_ui.document_id AND user_ui.user_id = ?
          WHERE d.status = 'published'
          AND user_ui.id IS NULL
          GROUP BY d.id
          ORDER BY downloads DESC, total_interactions DESC, unique_users DESC
          LIMIT ?
        `, [userId, limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            ...row,
            recommendation_reason: `Trending content in ${row.department}`,
            confidence_score: Math.min((row.downloads + row.total_interactions) / 100, 0.7)
          })));
        });
      });

      return recommendations;
    } catch (error) {
      console.error('Error in popular recommendations:', error);
      return [];
    }
  }

  // Sequential learning recommendations (next level progression)
  async getSequentialRecommendations(userId, limit) {
    try {
      const userHistory = await this.getUserInteractionHistory(userId);

      if (userHistory.length === 0) {
        return [];
      }

      // Find current level in each department
      const departmentLevels = {};
      userHistory.forEach(interaction => {
        if (interaction.department && interaction.level) {
          const current = departmentLevels[interaction.department];
          if (!current || this.compareLevels(interaction.level, current) > 0) {
            departmentLevels[interaction.department] = interaction.level;
          }
        }
      });

      const recommendations = [];

      for (const [department, currentLevel] of Object.entries(departmentLevels)) {
        const nextLevel = this.getNextLevel(currentLevel);
        if (nextLevel) {
          const levelRecs = await new Promise((resolve, reject) => {
            this.db.db.all(`
              SELECT d.*
              FROM documents d
              LEFT JOIN user_interactions ui ON d.id = ui.document_id AND ui.user_id = ?
              WHERE d.status = 'published'
              AND d.department = ?
              AND d.level = ?
              AND ui.id IS NULL
              ORDER BY d.date DESC
              LIMIT 3
            `, [userId, department, nextLevel], (err, rows) => {
              if (err) reject(err);
              else resolve(rows.map(row => ({
                ...row,
                recommendation_reason: `Next level in your ${department} learning journey`,
                confidence_score: 0.95
              })));
            });
          });
          recommendations.push(...levelRecs);
        }
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error in sequential recommendations:', error);
      return [];
    }
  }

  // Helper methods
  async getUserInteractionHistory(userId) {
    return new Promise((resolve, reject) => {
      this.db.db.all(`
        SELECT ui.*, d.title, d.department, d.level, d.docType
        FROM user_interactions ui
        JOIN documents d ON ui.document_id = d.id
        WHERE ui.user_id = ?
        ORDER BY ui.timestamp DESC
        LIMIT 50
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async findSimilarUsers(userId) {
    // Simple similarity based on department preferences
    return new Promise((resolve, reject) => {
      this.db.db.all(`
        SELECT ui2.user_id,
               COUNT(*) as shared_interactions
        FROM user_interactions ui1
        JOIN user_interactions ui2 ON ui1.document_id = ui2.document_id
        WHERE ui1.user_id = ?
        AND ui2.user_id != ?
        GROUP BY ui2.user_id
        ORDER BY shared_interactions DESC
        LIMIT 10
      `, [userId, userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getPopularDocuments(limit) {
    return new Promise((resolve, reject) => {
      this.db.db.all(`
        SELECT d.*,
               COUNT(ui.id) as interactions
        FROM documents d
        LEFT JOIN user_interactions ui ON d.id = ui.document_id
        WHERE d.status = 'published'
        GROUP BY d.id
        ORDER BY interactions DESC, d.date DESC
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          recommendation_reason: 'Popular content',
          confidence_score: 0.5
        })));
      });
    });
  }

  compareLevels(level1, level2) {
    const levelOrder = { 'Level 3': 3, 'Level 4': 4, 'Level 5': 5, 'Level 6': 6 };
    return (levelOrder[level1] || 0) - (levelOrder[level2] || 0);
  }

  getNextLevel(currentLevel) {
    const levels = ['Level 3', 'Level 4', 'Level 5', 'Level 6'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      if (seen.has(rec.id)) return false;
      seen.add(rec.id);
      return true;
    });
  }
}

module.exports = new RecommendationEngine();