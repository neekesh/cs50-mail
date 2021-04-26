document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email;
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  
  document.querySelector('#single-email-view').style.display ='none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}


function reply_email(email){
  compose_email();
  document.querySelector('#compose-recipients').value = email['sender'];
  document.querySelector('#compose-subject').value = 
    email["subject"].slice(0.4) === "Re: " ? email["subject"] : "Re: " + email["subject"];
  const pre_body_text = `\n \n \n---- On ${email["timestamp"]} ${email["sender"]} wrote: \n \n`;
  document.querySelector('#compose-body').value = pre_body_text + email["body"].replace(/^/gm, "\t")
  }

function archive_email(email_id, to_archive){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: to_archive //or not, that's the question.
    })
}).then( () => load_mailbox("inbox"));

}


function load_email(email_id, origin_mailbox){

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = "block";

  document.querySelector('#single-email-content').innerHTML = '';
  document.querySelector('#single-email-back-section').innerHTML = '';
  
  fetch(`/emails/${email_id}`)
    .then(response => response.json() )
    .then(email => {
      if ("error" in email){console.log(email)}
      ["subject", "timestamp", "sender", "recipients", "body"].forEach(email_element =>{
          const div_row  = document.createElement("div");
          div_row.classList.add("row",`email-${email_element}-section`);
          
          if (email_element==="sender"){
            div_row.innerHTML = `<p><b>From:</b>  ${email['sender']}<br>`;
          }
          else if (email_element==="recipients"){
            div_row.innerHTML= `<p><b>To:</b>  ${email['recipients']}<br>`;
          }
          else if (email_element === "subject"){
            //adding two buttons fo replying and archiving

            //for the subject section
            const div_col_subject = document.createElement('div');
            div_col_subject.classList.add('col-8');
            div_col_subject.id = "email-subject-subsection";
            div_col_subject.innerHTML = `<p><b>Subject:</b> ${email[email_element]}</p>`;
            div_row.append(div_col_subject);
            
            //for two buttons
            const div_col_reply_archive = document.createElement('div');
            div_col_reply_archive.classList.add('col-4');
            div_col_reply_archive.id = 'archive-reply-button';
            const data_for_potential_button_to_add = [
              ["Reply", ()=>reply_email(email)], //reply button
              [email['archived'] ? "Unarchive" :"Archive", //archive button
              ()=>archive_email(email_id, !email['archived'] )]
            ];

            //if the mailbox is sent then we dont need archive button 
            (origin_mailbox === 'sent' ? 
              data_for_potential_button_to_add.slice(0,1) : data_for_potential_button_to_add)
            .forEach( text_function => {
              const text = text_function[0];
              const callback_func = text_function[1];
              const button = document.createElement('button');
              button.classList.add("float-right", "btn", "btn-sm", "btn-outline-primary");
              button.innerHTML = text;
              button.addEventListener('click', callback_func);
              div_col_reply_archive.append(button);
            }); 
            div_row.append(div_col_reply_archive);
          }
          
          else if(email_element=="timestamp"){
            div_row.innerHTML = `<p><b>Date:</b>  ${email['timestamp']}<br>`;
          }
          else if (email_element==="body"){
            div_row.innerHTML=`${email['body']}<br>`;
          }
          
          document.querySelector('#single-email-content').append(div_row);
      });
      const back_button_row_div = document.createElement('div');
      back_button_row_div.classList.add('row');
      const back_button_col_div = document.createElement('div');
      back_button_col_div.classList.add('col-2', 'offset-5');
      back_button_col_div.id = "back-button";
      back_button_col_div.innerHTML = 
        `<p>${origin_mailbox.charAt(0).toUpperCase() + origin_mailbox.slice(1)}</p>`;
      back_button_col_div.addEventListener('click', ()=> load_mailbox(origin_mailbox));
      back_button_row_div.append(back_button_col_div);
      document.querySelector('#single-email-back-section').append(back_button_row_div);

    })
    .catch(error => console.log(error));

  }

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#single-email-view').style.display ='none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //updating the mailbox
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      const sections_to_show = [['sender', 5], ['subject', 3], ['timestamp', 4]];
      const artificial_first_email = {'sender': 'Sender', 'subject': 'Subject', 'timestamp': 'Date and Time',
       'read': true};
      emails = [artificial_first_email, ...emails];
      emails.forEach( email => {
        const row_div_element = document.createElement('div');
        row_div_element.classList.add("row", "email-line-box", email["read"] ? "read" : "unread");
        if (email === artificial_first_email){ row_div_element.id = "titled-first-row"}
        sections_to_show.forEach(
          section => {
            const section_name = section[0];
            const section_size = section[1];
            const div_section = document.createElement('div');
            div_section.classList.add(`col-${section_size}`, `${section_name}-section`);
            div_section.innerHTML = `<p>${email[section_name]}</p>`
            row_div_element.append(div_section);
          });
        if (email !== artificial_first_email){
          row_div_element.addEventListener('click', () => load_email(email["id"], mailbox));
        }
        document.querySelector('#emails-view').append(row_div_element);
      });
      
    })
    .catch(error => console.log(error));
}


function send_email() {
  //sending email
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  console.log("sending mail")
  console.log(recipients);
  fetch('/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      // Print result
      if ("message" in result) {
        load_mailbox('sent');
      }
      console.log("this is sth")
      console.log(result);
      console.log("message" in result);
    });

}