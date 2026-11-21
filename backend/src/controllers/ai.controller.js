import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Resource from '../models/Resource.js';
import * as aiService from '../services/ai.service.js';
import * as eventDraftService from '../services/eventDraft.service.js';

/**
 * Create a new conversation session for the authenticated student
 */
export const createConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.create({
      studentId: req.user.id,
      messages: [],
      draft: null,
      conversationStage: 'collecting_details',
    });

    return res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: {
        conversation: {
          id: conversation._id,
          conversationStage: conversation.conversationStage,
          messages: conversation.messages,
          draft: conversation.draft,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve an existing conversation belonging to the student
 */
export const getConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      studentId: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          id: conversation._id,
          conversationStage: conversation.conversationStage,
          messages: conversation.messages,
          draft: conversation.draft,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send student message, process with AI, normalize draft, and return response
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      studentId: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Load active campus resources
    const activeResources = await Resource.find({ isActive: true });

    // Call AI provider
    const aiResult = await aiService.extractEventDetails({
      messages: conversation.messages,
      newMessage: content,
      activeResources,
      currentDraft: conversation.draft,
    });

    // Normalize extracted details and resolve resources against database
    const normalizedDraft = eventDraftService.normalizeEventDraft({
      currentDraft: conversation.draft || {},
      aiDraft: aiResult.eventDraft,
      activeResources,
    });

    // Append user message and assistant response
    conversation.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
    });

    conversation.messages.push({
      role: 'assistant',
      content: aiResult.assistantMessage,
      timestamp: new Date(),
    });

    conversation.draft = normalizedDraft;
    conversation.conversationStage = normalizedDraft.conversationStage;

    await conversation.save();

    return res.status(200).json({
      success: true,
      data: {
        assistantMessage: aiResult.assistantMessage,
        eventDraft: normalizedDraft,
        conversationStage: conversation.conversationStage,
        missingFields: normalizedDraft.missingFields,
        clarificationsNeeded: normalizedDraft.clarificationsNeeded,
      },
    });
  } catch (error) {
    next(error);
  }
};
