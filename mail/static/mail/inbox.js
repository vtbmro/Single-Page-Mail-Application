document.addEventListener('DOMContentLoaded', function() 
{
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox'); 

  document.querySelector('#compose-form #submit').addEventListener("click", send_email);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function compose_email() 
{
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-displayed').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#email-displayed').value= '';
}

function load_mailbox(mailbox) 
{
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector("#email-displayed").style.display = "none";

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Makes api request and returns array with emails for each mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => 
    {
    headers_for_mailbox(mailbox)
    
    // Need to display the list of emails in the inbox page
    emails.forEach(email => {
      const element = document.createElement("div");
      element.classList.add("border","row","border-3");
      element.addEventListener("click",() => display_email(email.id, mailbox));
      
      if (mailbox == "sent"){
        element.style.backgroundColor = "white";
      }
      else if (email.read == 0){
        element.style.backgroundColor = "white";
      }
      else{
        element.style.backgroundColor = "#C0C0C0";
      }

      if (mailbox == "sent"){
        display_sent_email(email, "recipients", element);
        display_sent_email(email, "subject", element);
        display_sent_email(email, "timestamp", element);
      }
      else{
        display_sent_email(email, "sender", element);
        display_sent_email(email, "subject", element);
        display_sent_email(email, "timestamp", element);
      }

      // Event listener so the user can open the email
      document.querySelector("#emails-view").append(element);
      });
    })
}

// This is sending emails to DB, creating 2 instance of the email
// model where one is sent and teh other one is recieved
function send_email() 
{ 
  fetch('/emails', 
  {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector("#compose-recipients").value,
        subject: document.querySelector("#compose-subject").value,
        body: document.querySelector("#compose-body").value
    })
  })
  .then(response => response.json())
  .catch(err => console.error(err));

  setTimeout(() => {load_mailbox("sent");}, 100);
  return false
}

// This function was to simplify the code and basically 
// appends each email from the API reqiest to #emails-view
function display_sent_email(email, name_of_part, parent_element)
{
  const part_of_email = document.createElement("div");
  if (name_of_part == "recipients" || name_of_part == "sender"){
    part_of_email.classList.add("col-3","font-weight-bold","d-flex","justify-content-start");
  }else if (name_of_part == "subject"){
    part_of_email.classList.add("col-6");
  }else{
    part_of_email.classList.add("col-3","text-muted","d-flex","justify-content-end");

  }
  part_of_email.innerHTML = email[name_of_part];
  parent_element.append(part_of_email);
}

// Makes a header div for each of the mailbox options
function headers_for_mailbox(mailbox)
{ 
  let header_parts = ["", "Subject", "Timestamp"]
  if (mailbox == "sent") {header_parts[0] = "Sent to"
  }else if (mailbox == "inbox") {header_parts[0] = "Sender"
  }else {header_parts[0] = "Sender | Sent to"}
  
  // Creates a header for the emails view
  const main_header = document.createElement("div");
  main_header.classList.add("row")

  // Populates the header with apropiate titles
  for (let i = 0; i < header_parts.length; i++)
  {
    const element = document.createElement("div");
    if (header_parts[i] == "Timestamp"){
      element.classList.add("border","col-3","font-weight-bold","d-flex","justify-content-end");
      element.innerHTML = header_parts[i];
    }else if(header_parts[i] ==  "Subject"){
      element.classList.add("border", "col-6", "font-weight-bold");
      element.innerHTML = header_parts[i];
    }else if(header_parts[i] == "Sent to" || "Sender" || "Sender | Sent to"){
      element.classList.add("border","col-3","font-weight-bold");
      element.innerHTML = header_parts[i];
    }
    main_header.append(element);
  }
  document.querySelector("#emails-view").append(main_header);
}

// Function to display email when clicked on
function display_email(email_id, mailbox)
{
  // First hide the rest on the elements
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-displayed').innerHTML = "";
  document.querySelector('#email-displayed').style.display = 'block';

  // Fetch the JSON packet from the email
  document.querySelector("#email-displayed").classList.add("col")
  
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
  // HTML Elemnt id = email-displayed 
    read(email.id)

    let attributes = ["sender", "recipients", "subject", "timestamp", "body"]
    let html = ["<strong>From:</strong>","<strong>To:</strong>","<strong>Subject:</strong>","<strong>Timestamp:</strong>",""]

    for (let i = 0; i < attributes.length; i++)
    {
      const element = document.createElement("div")
      element.innerHTML = `${html[i]} ${email[attributes[i]]}`
      
      // Adds archive button if mail is inbox
      if (i == 4 && mailbox == "inbox"){
        const archive_button= document.createElement("button")
        archive_button.innerHTML = "Archive"
        archive_button.classList.add("btn","btn-secondary","mt-1")

        //Event listener when clicked archive the email
        archive_button.addEventListener('click', () => archive(email.id));
        document.querySelector("#email-displayed").append(archive_button)
        create_reply_button(mailbox, email)
        create_hr()
      // Addds unarchive button if mailbox is archive
      }else if (i == 4 && mailbox == "archive"){
        const archive_button= document.createElement("button")
        archive_button.innerHTML = "Unarchive"
        archive_button.classList.add("btn","btn-secondary","mt-1")

        //Event listener when clicked unarchive the email
        archive_button.addEventListener('click', () => unarchive(email.id));
        document.querySelector("#email-displayed").append(archive_button)
        create_reply_button(mailbox, email)
        create_hr()
      }else if (i == 4 && mailbox == "sent"){
        const archive_button= document.createElement("button")
        archive_button.innerHTML = "Archive"
        archive_button.classList.add("btn","btn-secondary","mt-1")

        //Event listener when clicked unarchive the email
        archive_button.addEventListener('click', () => archive(email.id));
        document.querySelector("#email-displayed").append(archive_button)
        create_reply_button(mailbox, email)
        create_hr()
      }
      document.querySelector("#email-displayed").append(element)
    }
  });
}

// Function to archive inbox email 
function archive (email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })
  load_mailbox("inbox");
}

// Function to unarchive archived email 
function unarchive (email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })
  load_mailbox("inbox")
}

// Function to mark an email as read
function read(email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

// Save lines of code by creating reply button
function create_reply_button(mailbox, email){
  const reply_button= document.createElement("button")
  reply_button.innerHTML = "Reply"
  reply_button.classList.add("btn","btn-primary","mt-1","ml-1")
  reply_button.addEventListener('click', () => reply(mailbox, email));
  document.querySelector("#email-displayed").append(reply_button)
}

// Simplify content create_hr
function create_hr(){
  const hr = document.createElement("hr")
  document.querySelector("#email-displayed").append(hr)
}

// Function to reply to emails
function reply(mailbox, email){ 
  document.querySelector('#compose-view').value = '';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-displayed').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  const recepients = document.querySelector("#compose-recipients")
  recepients.removeAttribute("placeholder")
  recepients.setAttribute("value", `${email.sender}`)

  const subject = document.querySelector("#compose-subject")
  subject.removeAttribute("placeholder")
  if (email.subject.substr(0, 3) == "Re:"){
    subject.setAttribute("value",`${email.subject}`)
  }else{
    subject.setAttribute("value",`Re: ${email.subject}`)
  }
  
  const body = document.querySelector("#compose-body")
  body.removeAttribute("placeholder")
  body.innerHTML = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`
}