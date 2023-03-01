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
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}