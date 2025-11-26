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
  StarBorder as StarBorderIcon,
  GetApp as ExportIcon,
  ShortText as TextIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckIcon,
  Subject as DescriptionIcon,
  Title as TitleIcon
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

  // Export survey responses to CSV
  const exportToCSV = () => {
    if (!responses.length || !surveyStructure) return;

    // 1. Gather all unique question IDs from current structure
    const allQuestionIds = new Set();
    const questionTextMap = {}; // ID -> Question Text

    // Add current structure questions
    surveyStructure.sections?.forEach(section => {
      section.questions?.forEach(q => {
        allQuestionIds.add(q.id);
        questionTextMap[q.id] = q.text;
      });
    });

    // 2. Scan all responses for any "legacy" or extra question IDs
    responses.forEach(response => {
      if (response.answers) {
        Object.keys(response.answers).forEach(qId => {
          if (!allQuestionIds.has(qId)) {
            allQuestionIds.add(qId);
            questionTextMap[qId] = `(Legacy) ${qId}`; // Fallback text
          }
        });
      }
    });

    // Convert Set to Array for consistent ordering
    const sortedQuestionIds = Array.from(allQuestionIds);

    // 3. Create CSV headers
    const headers = ['Timestamp', 'Username', 'Email'];
    // Append question texts as headers
    sortedQuestionIds.forEach(id => {
      // Escape quotes in headers just in case
      let headerText = questionTextMap[id] || id;
      if (headerText.includes(',') || headerText.includes('"')) {
        headerText = `"${headerText.replace(/"/g, '""')}"`;
      }
      headers.push(headerText);
    });

    // 4. Create CSV rows
    const csvRows = [headers.join(',')];

    responses.forEach(response => {
      const row = [
        new Date(response.timestamp).toLocaleString().replace(/,/g, ' '), // Avoid comma conflict in simple date
        (response.username || 'Anonymous').replace(/,/g, ' '),
        (response.email || 'N/A').replace(/,/g, ' ')
      ];

      // Add answers for each question column (even if empty for this user)
      sortedQuestionIds.forEach(questionId => {
        const answer = response.answers?.[questionId];
        let formattedAnswer = '';

        if (answer === null || answer === undefined) {
          formattedAnswer = '';
        } else if (Array.isArray(answer)) {
          // Multiple choice answers
          formattedAnswer = answer.join('; ');
        } else {
          // Single choice, text, or rating
          formattedAnswer = String(answer);
        }

        // Escape commas and quotes in CSV content
        if (formattedAnswer.includes(',') || formattedAnswer.includes('"') || formattedAnswer.includes('\n')) {
          formattedAnswer = `"${formattedAnswer.replace(/"/g, '""')}"`;
        }

        row.push(formattedAnswer);
      });

      csvRows.push(row.join(','));
    });

    // Create and download CSV file
    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `survey_responses_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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

  const handleDeleteResponse = (responseId) => {
    const responseRef = ref(db, `survey_responses/${responseId}`);
    remove(responseRef)
      .then(() => {
        alert('Survey response deleted successfully!');
      })
      .catch((err) => {
        alert('Error deleting survey response: ' + err.message);
        console.error('Delete error:', err);
      });
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
          onExport={exportToCSV}
          onDelete={handleDeleteResponse}
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

const SurveyResponses = ({ responses, onSelect, onExport, onDelete }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState(null);

  const handleDeleteClick = (response) => {
    setResponseToDelete(response);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (responseToDelete) {
      onDelete(responseToDelete.id);
      setDeleteDialogOpen(false);
      setResponseToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setResponseToDelete(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={onExport}
          disabled={responses.length === 0}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            bgcolor: '#2563EB',
            '&:hover': { bgcolor: '#1d4ed8' }
          }}
        >
          Export to CSV ({responses.length} responses)
        </Button>
      </Box>
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
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={() => onSelect(row)}>View Details</Button>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(row)}
                      sx={{
                        color: '#ef5350',
                        '&:hover': {
                          bgcolor: '#ffebee',
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#ffebee', color: '#c62828' }}>
          Delete Survey Response
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            Are you sure you want to delete this survey response?
          </Typography>
          {responseToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>User:</strong> {responseToDelete.username || 'Anonymous'}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {responseToDelete.email || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Submitted:</strong> {new Date(responseToDelete.timestamp).toLocaleString()}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Delete Response
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
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

  const updateOption = (sectionIndex, questionIndex, optionIndex, newValue) => {
    const newSections = [...surveyStructure.sections];
    const newOptions = [...(newSections[sectionIndex].questions[questionIndex].options || [])];
    newOptions[optionIndex] = newValue;
    newSections[sectionIndex].questions[questionIndex].options = newOptions;
    setSurveyStructure({ ...surveyStructure, sections: newSections });
  };

  const addOption = (sectionIndex, questionIndex) => {
    const newSections = [...surveyStructure.sections];
    const currentOptions = newSections[sectionIndex].questions[questionIndex].options || [];
    newSections[sectionIndex].questions[questionIndex].options = [...currentOptions, ""];
    setSurveyStructure({ ...surveyStructure, sections: newSections });
  };

  const removeOption = (sectionIndex, questionIndex, optionIndex) => {
    const newSections = [...surveyStructure.sections];
    const newOptions = [...(newSections[sectionIndex].questions[questionIndex].options || [])];
    newOptions.splice(optionIndex, 1);
    newSections[sectionIndex].questions[questionIndex].options = newOptions;
    setSurveyStructure({ ...surveyStructure, sections: newSections });
  };

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', pb: 10 }}>
      {/* Survey Header Card */}
      <Paper elevation={2} sx={{ mb: 4, p: 4, borderRadius: 3, borderLeft: '6px solid #1976d2', background: 'linear-gradient(to right, #fff, #f8fbff)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
           <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>Survey Configuration</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Survey Title"
              variant="outlined"
              value={surveyStructure.title || ''}
              onChange={(e) => setSurveyStructure({ ...surveyStructure, title: e.target.value })}
              InputProps={{ startAdornment: <TitleIcon sx={{ color: 'action.active', mr: 1 }} /> }}
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
              InputProps={{ startAdornment: <DescriptionIcon sx={{ color: 'action.active', mr: 1, alignSelf: 'flex-start', mt: 1 }} /> }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Sections List */}
      {surveyStructure.sections?.map((section, sIndex) => (
        <Accordion 
          key={sIndex} 
          defaultExpanded 
          sx={{ 
            mb: 3, 
            '&:before': { display: 'none' }, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
            borderRadius: '12px !important', 
            border: '1px solid #e0e0e0',
            overflow: 'hidden'
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />} 
            sx={{ 
              bgcolor: '#f0f4f8', 
              borderBottom: '1px solid #e0e0e0',
              '& .MuiAccordionSummary-content': { alignItems: 'center', justifyContent: 'space-between', pr: 2 }
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
              {section.title || `Section ${sIndex + 1}`}
            </Typography>
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); removeSection(sIndex); }} 
              sx={{ color: '#ef5350', bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </AccordionSummary>
          
          <AccordionDetails sx={{ p: 3, bgcolor: '#fafafa' }}>
            <TextField
              fullWidth
              label="Section Title"
              value={section.title}
              onChange={(e) => updateSectionTitle(sIndex, e.target.value)}
              sx={{ mb: 3, bgcolor: '#fff' }}
              variant="outlined"
              size="small"
            />

            {section.questions?.map((question, qIndex) => (
              <Paper 
                key={qIndex} 
                elevation={1}
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 2, 
                  bgcolor: '#ffffff', 
                  position: 'relative',
                  borderLeft: `5px solid ${question.type === 'text' ? '#4caf50' : question.type === 'rating' ? '#ff9800' : '#2196f3'}`,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                }}
              >
                <Box sx={{ position: 'absolute', right: 10, top: 10 }}>
                   <IconButton color="error" onClick={() => removeQuestion(sIndex, qIndex)} size="small">
                      <DeleteIcon />
                   </IconButton>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label={`Question ${qIndex + 1}`}
                      placeholder="Enter your question here"
                      value={question.text}
                      onChange={(e) => updateQuestion(sIndex, qIndex, 'text', e.target.value)}
                      variant="outlined"
                      multiline
                      maxRows={2}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Answer Type</InputLabel>
                      <Select
                        value={question.type}
                        label="Answer Type"
                        onChange={(e) => updateQuestion(sIndex, qIndex, 'type', e.target.value)}
                      >
                        <MenuItem value="text"><Box sx={{ display: 'flex', gap: 1 }}><TextIcon fontSize="small"/> Text Input</Box></MenuItem>
                        <MenuItem value="single_choice"><Box sx={{ display: 'flex', gap: 1 }}><RadioIcon fontSize="small"/> Single Choice</Box></MenuItem>
                        <MenuItem value="multiple_choice"><Box sx={{ display: 'flex', gap: 1 }}><CheckIcon fontSize="small"/> Multiple Choice</Box></MenuItem>
                        <MenuItem value="rating"><Box sx={{ display: 'flex', gap: 1 }}><StarIcon fontSize="small"/> Rating (1-5)</Box></MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                    <Grid item xs={12}>
                      <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>Options</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {(question.options || []).map((option, oIndex) => (
                            <Box key={oIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <DragIcon sx={{ color: '#ccc', cursor: 'grab' }} />
                              <TextField
                                fullWidth
                                size="small"
                                placeholder={`Option ${oIndex + 1}`}
                                value={option}
                                onChange={(e) => updateOption(sIndex, qIndex, oIndex, e.target.value)}
                                variant="outlined"
                                sx={{ bgcolor: '#fff' }}
                              />
                              <IconButton 
                                size="small" 
                                onClick={() => removeOption(sIndex, qIndex, oIndex)}
                                sx={{ color: '#ef5350' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                          <Button
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={() => addOption(sIndex, qIndex)}
                            sx={{ alignSelf: 'flex-start', mt: 1, textTransform: 'none', fontWeight: 600 }}
                          >
                            Add Option
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))}

            <Button 
              startIcon={<AddIcon />} 
              onClick={() => addQuestion(sIndex)} 
              variant="outlined" 
              sx={{ 
                mt: 1, 
                borderRadius: 2, 
                textTransform: 'none', 
                borderStyle: 'dashed', 
                borderWidth: 2,
                py: 1.5,
                '&:hover': { borderStyle: 'dashed', borderWidth: 2, bgcolor: '#f0f7ff' } 
              }}
              fullWidth
            >
              Add Question to "{section.title}"
            </Button>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />} 
          onClick={addSection}
          size="large"
          sx={{ 
             borderRadius: 8, 
             textTransform: 'none', 
             borderWidth: 2, 
             px: 4,
             mr: 2,
             '&:hover': { borderWidth: 2 }
          }}
        >
          Add New Section
        </Button>
      </Box>

      {/* Floating Save Button */}
      <Paper 
        elevation={4} 
        sx={{ 
          position: 'fixed', 
          bottom: 30, 
          right: 30, 
          zIndex: 1000,
          borderRadius: 8 
        }}
      >
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />} 
          onClick={onSave} 
          color="primary"
          size="large"
          sx={{ 
            borderRadius: 8, 
            px: 4, 
            py: 1.5, 
            textTransform: 'none', 
            boxShadow: 'none',
            fontWeight: 700
          }}
        >
          Save Changes
        </Button>
      </Paper>
    </Box>
  );
};

const ResponseDetailsDialog = ({ open, response, onClose, surveyStructure }) => {
  if (!response) return null;

  // 1. Build a list of all questions to display (Structure + Extras)
  const questionsToDisplay = [];
  const answeredIds = new Set(Object.keys(response.answers || {}));
  
  // Robustly handle sections whether array or object
  const sections = Array.isArray(surveyStructure?.sections) 
    ? surveyStructure.sections 
    : Object.values(surveyStructure?.sections || {});

  // Add questions from the current survey structure
  sections.forEach(section => {
    if (!section) return;
    
    questionsToDisplay.push({ type: 'section_header', title: section.title || 'Untitled Section' });
    
    const questions = Array.isArray(section.questions)
      ? section.questions
      : Object.values(section.questions || {});

    questions.forEach(q => {
      if (!q) return;
      questionsToDisplay.push({ 
        ...q, 
        answer: response.answers?.[q.id],
        isAnswered: answeredIds.has(q.id)
      });
      answeredIds.delete(q.id); // Remove from set to track what's left
    });
  });

  // Add remaining answers (questions that are no longer in the active survey)
  if (answeredIds.size > 0) {
    questionsToDisplay.push({ type: 'section_header', title: "Legacy / Deleted Questions" });
    answeredIds.forEach(id => {
      questionsToDisplay.push({
        id: id,
        text: `Question ID: ${id}`,
        type: 'unknown',
        answer: response.answers[id],
        isAnswered: true,
        isLegacy: true
      });
    });
  }

  const renderAnswer = (question, answer) => {
    // Handle skipped/unanswered questions
    if (answer === undefined || answer === null || answer === '') {
      return (
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#999' }}>
          No answer provided
        </Typography>
      );
    }

    // Rating / Star display
    if (question.type === 'rating') {
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

    // Array display (Multiple Choice)
    if (Array.isArray(answer)) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {answer.map((item, idx) => (
            <Chip key={idx} label={item} size="small" variant="outlined" />
          ))}
        </Box>
      );
    }

    // Default text display
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {questionsToDisplay.map((item, index) => {
            if (item.type === 'section_header') {
              return (
                <Typography key={`sec_${index}`} variant="h6" sx={{ color: '#1976d2', mt: 2, mb: 1, fontWeight: 600 }}>
                  {item.title}
                </Typography>
              );
            }

            return (
              <Paper key={item.id} elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: item.isLegacy ? '#fff3e0' : 'white' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#333', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ bgcolor: item.isLegacy ? '#ffcc80' : '#e3f2fd', color: item.isLegacy ? '#e65100' : '#1976d2', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem' }}>
                     {item.type ? item.type.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                  </Box>
                  {item.text || `Question ID: ${item.id}`}
                </Typography>
                {renderAnswer(item, item.answer)}
              </Paper>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SurveyTab;
