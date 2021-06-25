import { screen } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import firebase from "../__mocks__/firebase.js";
import { ROUTES } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills";

describe("Given I am connected as an employee", () => {
  describe("When Bills page is called", () => {
    test("Then it should render the bills", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });
  });
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI({ data: [] });
      const iconHighlighted = screen.getByTestId("icon-window");

      expect(iconHighlighted).toBeTruthy();
    });
    // Vérifie que les dates sont biens triées 
    test("Then bills should be ordered from latest to earliest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      expect(dates).toEqual(datesSorted);
    });
  }); 

  // test function handleCLickNewBill
  // vérifie qu'au clic sur le bouton nouvelle note de frais la fonction handleClikNewBill soit appelée 
  describe("When I click on the New Bill button", () => {
    test("Then I am arrived on bill/new page", () => {
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

      const firestore = null;

      const bill = new Bills({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const handleClickNewBill = jest.fn(bill.handleClickNewBill);
      const buttonNewBill = screen.queryByTestId("btn-new-bill");

      buttonNewBill.addEventListener("click", handleClickNewBill);
      userEvent.click(buttonNewBill);

      expect(handleClickNewBill).toHaveBeenCalled();
      
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  // test function handleClickIconEye
  // vérifie qu'au clic sur l'icone oeil la fonction handleClikNewBill soit appelée et 
  // vérifie que la modale s'ouvre
  describe("When I click on the eye icon", () => {
    test("Then a Modal should open", () => {      
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
     
      const firestore = null;
      
      const bill = new Bills({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });
      
      // emulate function bootstrap
      $.fn.modal = jest.fn();
      
      const handleClikIconEye = jest.fn(bill.handleClikIconEye);

      const eye = screen.getAllByTestId("icon-eye")[0];

      eye.addEventListener("click", handleClikIconEye);
      userEvent.click(eye);

      expect(handleClikIconEye).toHaveBeenCalled();

      const modale = screen.getByTestId("modaleFile");
      expect(modale).toBeTruthy();
    });
  });

  // Test views Ui
  // Vérifie l'abscence d'icone eye si le tableau de note est vide
  describe("When I am on Bills and no have bill", () => {
    test("Then the container are empty", () => {
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      const eye = screen.queryByTestId("icon-eye");

      expect(eye).toBeNull();
    });
  });

  // Vérifie que la page loading est bien rendue
  describe("When I am on Bills page but it is loading", () => {
    test("Then Loading page should be rendered", () => {
      const html = BillsUI({ loading: true });
      document.body.innerHTML = html;

      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });

  // Vérifie que la page error est bien rendue
  describe("When I am on Bills page but an error message is detected", () => {
    test("Then Error page should be rendrered", () => {
      const html = BillsUI({ error: "some error message" });
      document.body.innerHTML = html;

      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });
});

// test intégration GET Bills
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills UI", () => {
    // vérifie que le get de la database s'effectue correctement
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const bills = await firebase.get();

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    // verifie que la page error est bien affichée si il y a un reject dans l'appel de la database
    // 404 Ressource non trouvée
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() => Promise.reject(new Error("Erreur 404")));

      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;

      const message = await screen.getByText(/Erreur 404/);

      expect(message).toBeTruthy();
    });
    // verifie que la page error est bien affichée si il y a un reject dans l'appel de la database
    // 500 erreur du serveur
    test("fetches messages from an Api and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() => Promise.reject(new Error("Erreur 500")));

      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;

      const message = await screen.getByText(/Erreur 500/);

      expect(message).toBeTruthy();
    });
  });
});
