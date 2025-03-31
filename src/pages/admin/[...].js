// src/pages/admin.js
import React from "react";
import { Router, Location } from "@reach/router";
import Layout from "../../components/Layout";
// No need to import AdminRouteGuard here anymore
import AdminIndex from "../../components/admin/AdminIndex";
import ExamList from "../../components/admin/ExamList";
import ExamForm from "../../components/admin/ExamForm";
import QuestionList from "../../components/admin/QuestionList";
import QuestionForm from "../../components/admin/QuestionForm";
import ExamQuestionManager from "../../components/admin/ExamQuestionManager";
import UserList from "../../components/admin/UserList";
import UserForm from "../../components/admin/UserForm";
// Import a simple component for unauthorized access
import AdminUnauthorized from "../../components/admin/AdminUnauthorized"; // We will create this

const AdminPage = () => {
  return (
    <Layout>
      {/* The main heading can stay */}
      {/* <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1> */}
      <Location>
        {({ location }) => (
          // Render the router directly with the page components
          <Router basepath="/admin" location={location} primary={false}>
            <AdminIndex path="/" />
            <ExamList path="/exams" />
            <ExamForm path="/exams/new" />
            <ExamForm path="/exams/edit/:examId" />
            <ExamQuestionManager path="/exams/manage/:examId" />
            <QuestionList path="/questions" />
            <QuestionForm path="/questions/new" />
            <QuestionForm path="/questions/edit/:questionId" />
            <UserList path="/users" />
            <UserForm path="/users/edit/:userId" />
            {/* Add a default component for handling routes that don't match */}
            <AdminUnauthorized default />
          </Router>
        )}
      </Location>
    </Layout>
  );
};

export default AdminPage;
