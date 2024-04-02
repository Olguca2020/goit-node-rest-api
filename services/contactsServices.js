import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";

const contactsPath = path.join("db", "contacts.json");

async function listContacts() {
  try {
    const contacts = await fs.readFile(contactsPath);
    const contactsJSON = JSON.parse(contacts.toString());
    return contactsJSON;
  } catch (er) {
    console.log(er);
  }
}

async function getContactById(contactId) {
  try {
    const contacts = await listContacts();
    const findeContact = contacts.find((contact) => contact.id === contactId);
    return findeContact || null;
  } catch (er) {
    console.log(er);
  }
}

async function removeContact(contactId) {
  try {
    const contacts = await listContacts();
    const newArray = contacts.filter((contact) => contact.id !== contactId);
    const deletedContact = await getContactById(contactId);

    await fs.writeFile(contactsPath, JSON.stringify(newArray));

    return deletedContact !== undefined ? deletedContact : null;
  } catch (er) {
    console.log(er);
  }
}

async function addContact(contact) {
  try {
    const contacts = await listContacts();
    const newContact = { id: nanoid(), ...contact };
    contacts.push(newContact);
    await fs.writeFile(contactsPath, JSON.stringify(contacts));
    return newContact;
  } catch (er) {
    console.log(er);
  }
}

async function updateContact(id, data) {
  try {
    const contacts = await listContacts();
    const index = contacts.findIndex((contact) => contact.id === id);
    if (index === -1) {
      return null;
    }
    contacts[index] = { id, ...data };
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
    return contacts[index];
  } catch (error) {
    console.log(error);
  }
}
export default {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
