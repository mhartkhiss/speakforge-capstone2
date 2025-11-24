import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { getDatabase, ref, onValue, set, push, remove } from 'firebase/database';
import app from '../../../firebase';

const db = getDatabase(app);

const SurveyTab = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [surveyStructure, setSurveyStructure] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);

  useEffect(() => {
    // Listen for survey structure
    const surveyRef = ref(db, 'surveys/active_survey');
    const unsubscribeSurvey = onValue(surveyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSurveyStructure(data);
      } else {
        // Default structure seeded from the requested preset
        setSurveyStructure({
          title: "SpeakForge Mobile App User Survey",
          description: "Thank you for helping us improve SpeakForge! We are focusing on making English ↔ Bisaya translation seamless and accurate. This survey will take about 5 minutes.",
          sections: [
            {
              title: "Section 1: General Usage",
              questions: [
                {
                  id: "q1",
                  text: "How often do you use SpeakForge?",
                  type: "single_choice",
                  options: ["Daily", "Weekly", "Occasionally", "Just downloaded it"]
                },
                {
                  id: "q2",
                  text: "What is your primary reason for using the app?",
                  type: "single_choice",
                  options: [
                    "Communicating with family/friends (Bisaya/English speakers)",
                    "Learning Bisaya or English",
                    "Work / Professional communication",
                    "Travel in Visayas/Mindanao regions",
                    "Testing the technology"
                  ]
                },
                {
                  id: "q3",
                  text: "Which features do you use the most? (Select all that apply)",
                  type: "multiple_choice",
                  options: [
                    "Text-to-Text Translation",
                    "Voice-to-Text (Single Screen)",
                    "Split-Screen Conversation (Face-to-Face)",
                    "Connect Mode (Chat with QR Code/Search)",
                    "Translation History"
                  ]
                }
              ]
            },
            {
              title: "Section 2: Translation Quality & Speed",
              questions: [
                {
                  id: "q4",
                  text: "How accurate do you find the Bisaya ↔ English translations? (1 = Inaccurate, 5 = Native-sounding)",
                  type: "rating"
                },
                {
                  id: "q5",
                  text: "How would you rate the SPEED of the translation generation? (1 = Very Slow, 5 = Instant)",
                  type: "rating"
                },
                {
                  id: "q6",
                  text: "Have you tried switching the \"Translation Mode\" (Formal vs. Casual)?",
                  type: "single_choice",
                  options: [
                    "Yes, and the difference in tone was helpful.",
                    "Yes, but I didn't notice much difference.",
                    "No, I didn't know I could do that."
                  ]
                },
                {
                  id: "q7",
                  text: "Which AI Translator engine do you prefer? (If you have changed it in settings)",
                  type: "single_choice",
                  options: [
                    "Default (Gemini)",
                    "Claude",
                    "DeepSeek",
                    "I haven't changed it / Don't know"
                  ]
                }
              ]
            },
            {
              title: "Section 3: Problems Encountered",
              questions: [
                {
                  id: "q8",
                  text: "Have you experienced any of the following technical issues? (Select all that apply)",
                  type: "multiple_choice",
                  options: [
                    "Microphone Issues: App doesn't hear me or cuts off too early.",
                    "Connection Errors: \"Failed to connect\" or network timeouts.",
                    "Translation Errors: The meaning was completely wrong.",
                    "Scanning Issues: Trouble scanning the QR code in Connect Mode.",
                    "App Crashes: The app closed unexpectedly.",
                    "Audio Playback: Text-to-speech didn't work or sounded robotic.",
                    "None of the above."
                  ]
                },
                {
                  id: "q9",
                  text: "If you selected an issue above, can you briefly describe what happened?",
                  type: "text",
                  options: []
                }
              ]
            },
            {
              title: "Section 4: User Interface (UI)",
              questions: [
                {
                  id: "q10",
                  text: "How would you rate the new \"Welcome / Language Setup\" screen? (1 = Confusing, 5 = Clean & Easy to use)",
                  type: "rating"
                },
                {
                  id: "q11",
                  text: "For Split-Screen (Face-to-Face) mode, is the layout comfortable for two people?",
                  type: "single_choice",
                  options: [
                    "Yes, the upside-down layout works perfectly.",
                    "It's okay, but buttons are hard to reach.",
                    "No, it's confusing to use."
                  ]
                }
              ]
            },
            {
              title: "Section 5: Final Thoughts",
              questions: [
                {
                  id: "q12",
                  text: "Since the app focuses only on English and Bisaya, are there specific Bisaya words or phrases it struggles with?",
                  type: "text",
                  options: []
                },
                {
                  id: "q13",
                  text: "How likely are you to recommend SpeakForge to a friend who needs Bisaya translation? (1-10)",
                  type: "text",
                  options: [] 
                }
              ]
            }
          ]
        });
      }
      setLoading(false);
    });

    // Listen for responses
    const responsesRef = ref(db, 'survey_responses');
    const unsubscribeResponses = onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const responsesList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        // Sort by timestamp descending
        responsesList.sort((a, b) => b.timestamp - a.timestamp);
        setResponses(responsesList);
      } else {
        setResponses([]);
      }
    });

    return () => {
      unsubscribeSurvey();
      unsubscribeResponses();
    };
  }, []);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSaveSurvey = () => {
    const surveyRef = ref(db, 'surveys/active_survey');
    set(surveyRef, surveyStructure)
      .then(() => alert('Survey updated successfully!'))
      .catch(err => alert('Error updating survey: ' + err.message));
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
        Survey Management
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
          <Tab label="Responses" />
          <Tab label="Edit Questionnaire" />
        </Tabs>
      </Paper>

      {currentTab === 0 && (
        <SurveyResponses 
          responses={responses} 
          surveyStructure={surveyStructure}
          onSelect={(r) => setSelectedResponse(r)}
        />
      )}

      {currentTab === 1 && (
        <SurveyEditor 
          surveyStructure={surveyStructure} 
          setSurveyStructure={setSurveyStructure}
          onSave={handleSaveSurvey}
        />
      )}

      {selectedResponse && (
        <ResponseDetailsDialog 
          open={!!selectedResponse} 
          response={selectedResponse} 
          onClose={() => setSelectedResponse(null)}
          surveyStructure={surveyStructure}
        />
      )}
    </Box>
  );
};

const SurveyResponses = ({ responses, onSelect }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {responses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">No responses yet</TableCell>
            </TableRow>
          ) : (
            responses.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                <TableCell>{row.username || 'Anonymous'}</TableCell>
                <TableCell>{row.email || 'N/A'}</TableCell>
                <TableCell>
                  <Chip label="Completed" color="success" size="small" />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => onSelect(row)}>View Details</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const SurveyEditor = ({ surveyStructure, setSurveyStructure, onSave }) => {
  const addSection = () => {
    const newSection = {
      title: "New Section",
      questions: []
    };
    setSurveyStructure({
      ...surveyStructure,
      sections: [...(surveyStructure.sections || []), newSection]
    });
  };

  const updateSectionTitle = (index, title) => {
    const newSections = [...surveyStructure.sections];
    newSections[index].title = title;
    setSurveyStructure({ ...surveyStructure, sections: newSections });
  };

  const removeSection = (index) => {
    if (window.confirm("Delete this section and all its questions?")) {
      const newSections = [...surveyStructure.sections];
      newSections.splice(index, 1);
      setSurveyStructure({ ...surveyStructure, sections: newSections });
    }
  };

  const addQuestion = (sectionIndex) => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      text: "New Question",
      type: "text",
      options: []
    };
    const newSections = [...surveyStructure.sections];
    if (!newSections[sectionIndex].questions) newSections[sectionIndex].questions = [];
    newSections[sectionIndex].questions.push(newQuestion);
    setSurveyStructure({ ...surveyStructure, sections: newSections });
  };

  const updateQuestion = (sectionIndex, questionIndex, field, value) => {
    const newSections = [...surveyStructure.sections];
    newSections[sectionIndex].questions[questionIndex][field] = value;
    setSurveyStructure({ ...surveyStructure, sections: newSections });
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    const newSections = [...surveyStructure.sections];
    newSections[sectionIndex].questions.splice(questionIndex, 1);
    setSurveyStructure({ ...surveyStructure, sections: newSections });
  };

  const updateOptions = (sectionIndex, questionIndex, optionsString) => {
    const options = optionsString.split(',').map(s => s.trim()).filter(s => s);
    updateQuestion(sectionIndex, questionIndex, 'options', options);
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ mb: 3, p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>Survey Settings</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Survey Title"
              variant="outlined"
              value={surveyStructure.title || ''}
              onChange={(e) => setSurveyStructure({ ...surveyStructure, title: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Survey Description"
              multiline
              rows={3}
              variant="outlined"
              value={surveyStructure.description || ''}
              onChange={(e) => setSurveyStructure({ ...surveyStructure, description: e.target.value })}
              helperText="This text will appear at the top of the survey in the mobile app."
            />
          </Grid>
        </Grid>
      </Paper>

      {surveyStructure.sections?.map((section, sIndex) => (
        <Accordion key={sIndex} defaultExpanded sx={{ mb: 2, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px !important', border: '1px solid #eee' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f8f9fa', borderRadius: '8px 8px 0 0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', pr: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#444' }}>
                {section.title || `Section ${sIndex + 1}`}
              </Typography>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeSection(sIndex); }} sx={{ color: '#ef5350' }}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <TextField
              fullWidth
              label="Section Title"
              value={section.title}
              onChange={(e) => updateSectionTitle(sIndex, e.target.value)}
              sx={{ mb: 3 }}
              variant="standard"
            />

            {section.questions?.map((question, qIndex) => (
              <Box key={qIndex} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#ffffff', position: 'relative' }}>
                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', bgcolor: '#1976d2', borderRadius: '4px 0 0 4px' }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label={`Question ${qIndex + 1}`}
                      placeholder="Enter your question here"
                      value={question.text}
                      onChange={(e) => updateQuestion(sIndex, qIndex, 'text', e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8f9fa' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Answer Type</InputLabel>
                      <Select
                        value={question.type}
                        label="Answer Type"
                        onChange={(e) => updateQuestion(sIndex, qIndex, 'type', e.target.value)}
                      >
                        <MenuItem value="text">Text Input</MenuItem>
                        <MenuItem value="single_choice">Single Choice (Radio)</MenuItem>
                        <MenuItem value="multiple_choice">Multiple Choice (Checkbox)</MenuItem>
                        <MenuItem value="rating">Rating (1-5 Stars)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <IconButton color="error" onClick={() => removeQuestion(sIndex, qIndex)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  
                  {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Options"
                        placeholder="Option 1, Option 2, Option 3"
                        value={question.options?.join(', ') || ''}
                        onChange={(e) => updateOptions(sIndex, qIndex, e.target.value)}
                        helperText="Separate options with commas"
                        variant="standard"
                        InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 1, color: 'text.secondary' }}>OPTIONS:</Typography> }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}

            <Button 
              startIcon={<AddIcon />} 
              onClick={() => addQuestion(sIndex)} 
              variant="outlined" 
              sx={{ mt: 1, borderRadius: 2, textTransform: 'none', borderStyle: 'dashed' }}
              fullWidth
            >
              Add Question to "{section.title}"
            </Button>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', pt: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />} 
          onClick={addSection}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Add New Section
        </Button>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />} 
          onClick={onSave} 
          color="primary"
          size="large"
          sx={{ borderRadius: 2, px: 4, textTransform: 'none', boxShadow: '0 4px 12px rgba(56, 122, 223, 0.3)' }}
        >
          Save All Changes
        </Button>
      </Box>
    </Box>
  );
};

const ResponseDetailsDialog = ({ open, response, onClose, surveyStructure }) => {
  if (!response) return null;

  // Flatten questions for easy lookup to get question text and type
  const questionsMap = {};
  surveyStructure?.sections?.forEach(section => {
    section.questions?.forEach(q => {
      questionsMap[q.id] = { text: q.text, type: q.type };
    });
  });

  const renderAnswer = (questionId, answer) => {
    const questionInfo = questionsMap[questionId];
    
    // Rating / Star display
    if (questionInfo?.type === 'rating') {
      const rating = parseInt(answer, 10);
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              star <= rating ? 
                <StarIcon key={star} sx={{ color: '#faaf00', fontSize: 20 }} /> : 
                <StarBorderIcon key={star} sx={{ color: '#ddd', fontSize: 20 }} />
            ))}
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666' }}>
            ({rating}/5)
          </Typography>
        </Box>
      );
    }

    // Default display for other types
    if (Array.isArray(answer)) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {answer.map((item, idx) => (
            <Chip key={idx} label={item} size="small" variant="outlined" />
          ))}
        </Box>
      );
    }

    return (
      <Typography variant="body1" sx={{ bgcolor: '#f9f9f9', p: 1, borderRadius: 1, border: '1px solid #eee' }}>
        {answer}
      </Typography>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ bgcolor: '#f5f5f5', pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Survey Response</Typography>
            <Typography variant="body2" color="textSecondary">
              Submitted by <Box component="span" sx={{ fontWeight: 'bold', color: '#387ADF' }}>{response.username}</Box>
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" display="block" color="textSecondary">
              {new Date(response.timestamp).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              {new Date(response.timestamp).toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(response.answers || {}).map(([questionId, answer]) => (
            <Paper key={questionId} elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#333', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem' }}>
                   {questionsMap[questionId]?.type ? questionsMap[questionId].type.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                </Box>
                {questionsMap[questionId]?.text || `Question ID: ${questionId}`}
              </Typography>
              {renderAnswer(questionId, answer)}
            </Paper>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SurveyTab;
