import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import firebase from "../__mocks__/firebase.js";
import Firestore from "../app/Firestore.js";
import BillsUI from "../views/BillsUI.js";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";

jest.mock("../app/Firestore");

describe("Given I am connected as an employee", () => {
  describe("When I am click on NewBill button", () => {
    test("Then I am check if the NewBill Page is render correctly", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  describe("When I am on NewBill Page, I click on submit button", () => {
    test("Then handleSubmit is running", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill = new NewBill({
        document,
        onNavigate,
        Firestore,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const buttonSubmit = document.getElementById("btn-send-bill");
      buttonSubmit.addEventListener("click", handleSubmit);
      userEvent.click(buttonSubmit);      
      expect(handleSubmit).toBeCalled();
    });
  });
});

// test intégration
describe("Given I am a user connected as Employee", () => {
  describe("when I create a new bill", () => {
    test("Add bill from mock API POST", async () => {
      const postSpy = jest.spyOn(firebase, "post");
      const newBill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "refused",
        type: "Hôtel et logement",
        commentAdmin: "Voir avec l'employé",
        commentary: "séminaire billed",
        name: "Facture nuit hotel pour séminaire sur la foudre",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2021-05-21",
        amount: 400,
        email: "a@a",
        pct: 20,
      };
      const bills = await firebase.post(newBill);
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(5);
    });
    test("Add bill to API and fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error("Erreur 404")));
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("Add bill to API and fails with 500 messager error", async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error("Erreur 500")));
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
