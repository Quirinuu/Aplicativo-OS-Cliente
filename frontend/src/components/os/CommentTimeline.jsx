import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageSquare, 
  Stethoscope, 
  Wrench, 
  FileText, 
  CheckCircle2,
  Send,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { safeFormatDate } from '@/utils/date';

const commentTypeConfig = {
  DIAGNOSIS: {
    label: "Diagnóstico",
    icon: Stethoscope,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  REPAIR: {
    label: "Reparo",
    icon: Wrench,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  NOTE: {
    label: "Observação",
    icon: FileText,
    color: "bg-slate-100 text-slate-700 border-slate-200",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200"
  },
  FINAL: {
    label: "Finalização",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 border-green-200",
    badgeColor: "bg-green-50 text-green-700 border-green-200"
  }
};

// Versão simplificada para exibição (sem formulário)
export default function CommentTimeline({ comments = [], onAddComment, loading = false, showForm = true }) {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('NOTE');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!newComment.trim() || !onAddComment) return;
    
    setSubmitting(true);
    try {
      await onAddComment({ 
        commentType: commentType,
        content: newComment
      });
      setNewComment('');
      setCommentType('NOTE');
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Ordenar comentários por data (mais antigos primeiro para timeline)
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at || a.created_date || 0);
    const dateB = new Date(b.createdAt || b.created_at || b.created_date || 0);
    return dateA - dateB; // Ordena do mais antigo para o mais recente
  });

  // Se não há formulário, apenas exibir os comentários
  if (!showForm) {
    return (
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p>Nenhum comentário registrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sortedComments.map((comment, index) => {
                const config = commentTypeConfig[comment.commentType || comment.comment_type] || commentTypeConfig.NOTE;
                const Icon = config.icon;
                
                const commentContent = comment.content || comment.body || '';
                const commentDate = comment.createdAt || comment.created_at || comment.created_date;
                const authorName = comment.user?.fullName || comment.user?.full_name || 'Usuário';
                const authorInitial = authorName.charAt(0).toUpperCase();
                
                return (
                  <motion.div
                    key={comment.id || `comment-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4"
                  >
                    {/* Linha do tempo */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {index < sortedComments.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 mt-2" />
                      )}
                    </div>
                    
                    {/* Conteúdo do comentário */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                            {authorInitial}
                          </div>
                          <span className="font-medium text-slate-800">
                            {authorName}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${config.badgeColor} border`}>
                            {config.label}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {safeFormatDate(commentDate)}
                        </span>
                      </div>
                      <p className="text-slate-600 whitespace-pre-wrap">
                        {commentContent}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // Com formulário
  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <MessageSquare className="w-4 h-4" />
          Adicionar Comentário
        </div>
        
        {/* Textarea para comentário */}
        <div className="space-y-2">
          <Label htmlFor="new-comment-text" className="sr-only">
            Comentário
          </Label>
          <Textarea
            id="new-comment-text"
            name="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Digite seu comentário técnico..."
            rows={3}
            className="bg-white resize-none"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            <Label htmlFor="comment-type-select" className="sr-only">
              Tipo de Comentário
            </Label>
            <Select value={commentType} onValueChange={setCommentType}>
              <SelectTrigger id="comment-type-select" name="commentType" className="w-full sm:w-44">
                <SelectValue placeholder="Selecionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOTE">Observação</SelectItem>
                <SelectItem value="DIAGNOSIS">Diagnóstico</SelectItem>
                <SelectItem value="REPAIR">Reparo</SelectItem>
                <SelectItem value="FINAL">Finalização</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={!newComment.trim() || submitting || !onAddComment}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p>Nenhum comentário registrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {sortedComments.map((comment, index) => {
              const config = commentTypeConfig[comment.commentType || comment.comment_type] || commentTypeConfig.NOTE;
              const Icon = config.icon;
              
              const commentContent = comment.content || comment.body || '';
              const commentDate = comment.createdAt || comment.created_at || comment.created_date;
              const authorName = comment.user?.fullName || comment.user?.full_name || 'Usuário';
              const authorInitial = authorName.charAt(0).toUpperCase();
              
              return (
                <motion.div
                  key={comment.id || `comment-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4"
                >
                  {/* Linha do tempo */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < sortedComments.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 mt-2" />
                    )}
                  </div>
                  
                  {/* Conteúdo do comentário */}
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {authorInitial}
                        </div>
                        <span className="font-medium text-slate-800">
                          {authorName}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.badgeColor} border`}>
                          {config.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {safeFormatDate(commentDate)}
                      </span>
                    </div>
                    <p className="text-slate-600 whitespace-pre-wrap">
                      {commentContent}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}