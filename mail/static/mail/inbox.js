document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // my code:
  const composeForm = document.querySelector('#compose-form');
  composeForm.addEventListener('submit', event => {
    event.preventDefault(); // prevent default form submission behavior

    // Get form data and send email
    const recipients = composeForm.querySelector('#compose-recipients').value;
    const subject = composeForm.querySelector('#compose-subject').value;
    const body = composeForm.querySelector('#compose-body').value;
    send_email(recipients, subject, body);

    // Clear out composition fields and go back to inbox
    // composeForm.querySelector('#compose-recipients').value = '';
    // composeForm.querySelector('#compose-subject').value = '';
    // composeForm.querySelector('#compose-body').value = '';
    // load_mailbox('sent');
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_email(recipients, subject, body) {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => {
      if (response.status === 201) {
        return response.json();
      } else if (response.error === 401) {
        throw new Error('At least one recipient required.');
      } else if (response.status === 400) {
        throw new Error('User with email ' + recipients + ' does not exist.');
      } else {
        throw new Error('Failed to send email.');
      }
    })
    .then(data => {
      console.log(data.message); // Email sent successfully
      load_mailbox('sent'); // Load the sent mailbox
    })
    .catch(error => {
      console.error(error);
    });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Request emails for the specified mailbox
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Create a container for the emails
      const emailsContainer = document.createElement('div');
      emailsContainer.classList.add('emails-container');


      // Render each email
      emails.forEach(email => {
        // Create a container for the email box
        const emailBox = document.createElement('div');
        emailBox.addEventListener('click', () => {
          view_email(email.id, mailbox);
        })
        emailBox.classList.add('email-box');

        // Set the background color based on the mailbox and read status of the email
        if (mailbox === "sent") {
          emailBox.style.backgroundColor = '#f2f2f2';
        } else if (email.read) {
          emailBox.style.backgroundColor = '#f2f2f2';
        } else {
          emailBox.style.backgroundColor = 'white';
        }

        // Add the sender, subject, and timestamp to the email box
        const sender = document.createElement('span');
        sender.classList.add('sender')
        sender.innerHTML = email.sender;
        const subject = document.createElement('span');
        subject.classList.add('subject')
        subject.innerHTML = email.subject;
        const timestamp = document.createElement('span');
        timestamp.classList.add('timestamp')
        timestamp.innerHTML = email.timestamp;

        // Add the sender, subject, and timestamp to the email box
        emailBox.appendChild(sender);
        emailBox.appendChild(subject);
        emailBox.appendChild(timestamp);

        // Add the font-weight style to the sender span for unread emails in the inbox
        if (mailbox === "inbox" && !email.read) {
          sender.style.fontWeight = "bold";
          subject.style.fontWeight = "bold";
          timestamp.style.fontWeight = "bold";
        }

        // Add the email box to the emails container
        emailsContainer.appendChild(emailBox);
      });

      // Add the emails container to the emails view
      document.querySelector('#emails-view').appendChild(emailsContainer);
    });
}

function view_email(email_id, mailbox) {
  // Hide the emails view and show the email view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Make a GET request to /emails/<email_id> to retrieve the email content
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      console.log(email);
      // Display the email content in the email view
      const emailView = document.querySelector('#email-view');
      emailView.innerHTML = `
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        ${mailbox !== 'sent' ? `<button class="btn btn-sm btn-outline-primary archive">${email.archived ? 'Unarchive' : 'Archive'}</button>` : ''}
        <hr>
        <p>${email.body}</p>
        ${mailbox !== 'sent' ? `<button class="btn btn-sm btn-outline-primary reply">Reply</button>` : "" }
      `;
      
      // Add an event listener to the archive button
      const archiveBtn = emailView.querySelector('.archive');
      if (archiveBtn) {
        archiveBtn.addEventListener('click', () => {
          const newState = !email.archived;
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: newState
            })
          })
            .then(() => {
              email.archived = newState;
              archiveBtn.textContent = newState ? 'Unarchive' : 'Archive';
              load_mailbox('inbox');
            })
            .catch(error => console.error(error));
        });
      }

      // Add an event listener to the reply button
      const replyBtn = emailView.querySelector('.reply');
      if (replyBtn) {
        replyBtn.addEventListener('click', () => {
          compose_email();
          const composeRecipients = document.querySelector('#compose-recipients');
          const composeSubject = document.querySelector('#compose-subject');
          const composeBody = document.querySelector('#compose-body');
          // pre-fill the composition form with the recipient field set to whoever sent the original email
          composeRecipients.value = email.sender;
          // pre-fill the subject line
          const rePrefix = email.subject.toLowerCase().startsWith('re:');
          composeSubject.value = rePrefix ? email.subject : `Re: ${email.subject}`;
          // pre-fill the body of the email with a line like "On Jan 1 2020, 12:00 AM foo@example.com wrote:"
          composeBody.value = `\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}\n`;
          // set cursor at the beginning of composeBody field
          composeBody.focus();
          composeBody.selectionStart = 0;
          composeBody.selectionEnd = 0;
        });
      }

      // Mark email as read if it is unread
      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        }).catch(error => console.error(error));
      }
    })
    .catch(error => console.error(error));
}
