(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const LOTTO_PRICE = 1e3;
const LOTTO_SIZE = 6;
const LOTTO_NUMBER_RANGE = {
  MIN: 1,
  MAX: 45
};
const RANK = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
  FIFTH: 5,
  NONE: 0
};
const PRIZE = {
  0: 0,
  1: 2e9,
  2: 3e7,
  3: 15e5,
  4: 5e4,
  5: 5e3
};
const CONDITION = {
  1: "6개",
  2: "5개+보너스볼",
  3: "5개",
  4: "4개",
  5: "3개"
};
function matchWinningCount(lotto, winningLotto) {
  return lotto.filter((number) => winningLotto.includes(number)).length;
}
function matchBonus(lotto, bonusNum) {
  return lotto.includes(bonusNum);
}
function calPrize(count, hasBonus) {
  if (count === 6) return RANK.FIRST;
  else if (count === 5 && hasBonus) return RANK.SECOND;
  else if (count === 5) return RANK.THIRD;
  else if (count === 4) return RANK.FOURTH;
  else if (count === 3) return RANK.FIFTH;
  return RANK.NONE;
}
function calProfitRate(price, totalPrize) {
  return totalPrize / price * 100;
}
const ERROR_MESSAGE = Object.freeze({
  INVALID_PURCHASE_UNIT: `[ERROR] 구입 금액은 ${LOTTO_PRICE}원 단위여야 합니다.`,
  INVALID_LOTTO_NUM_RANGE: `[ERROR] 로또 번호는 ${LOTTO_NUMBER_RANGE.MIN}-${LOTTO_NUMBER_RANGE.MAX} 범위여야합니다.`,
  DUPLICATE_LOTTO_NUMBERS: "[ERROR] 로또 번호에 중복된 숫자가 있습니다.",
  BONUS_IN_WINNING_NUMBERS: "[ERROR] 보너스 번호는 당첨 번호와 중복될 수 없습니다.",
  INVALID_LOTTO_COUNT: `[ERROR] 로또 번호는 ${LOTTO_SIZE}개여야 합니다.`,
  INVALID_RESTART_ANSWER: "[ERROR] 대답은 y/n로 답해야 합니다.",
  NOT_NUMBER: "[ERROR] 정수로 입력해주세요."
});
const Validator = {
  validateNumber(input) {
    if (!Number.isInteger(input)) throw new Error(ERROR_MESSAGE.NOT_NUMBER);
  },
  validatePurchaseUnit(price) {
    if (price % LOTTO_PRICE !== 0 || price <= 0) {
      throw new Error(ERROR_MESSAGE.INVALID_PURCHASE_UNIT);
    }
  },
  validateLottoNumRange(lottoNum) {
    if (lottoNum > LOTTO_NUMBER_RANGE.MAX || lottoNum < LOTTO_NUMBER_RANGE.MIN) {
      throw new Error(ERROR_MESSAGE.INVALID_LOTTO_NUM_RANGE);
    }
  },
  validateDuplicateLottoNums(lottoNums) {
    if (lottoNums.length !== new Set(lottoNums).size) {
      throw new Error(ERROR_MESSAGE.DUPLICATE_LOTTO_NUMBERS);
    }
  },
  validateDuplicateBonusNum(winningNums, bonusNum) {
    if (winningNums.includes(bonusNum)) {
      throw new Error(ERROR_MESSAGE.BONUS_IN_WINNING_NUMBERS);
    }
  },
  validateLottoCount(lotto) {
    if (lotto.length !== LOTTO_SIZE) {
      throw new Error(ERROR_MESSAGE.INVALID_LOTTO_COUNT);
    }
  },
  validateRestartAnswer(restartAnswer) {
    if (!(restartAnswer === "y" || restartAnswer === "n")) {
      throw new Error(ERROR_MESSAGE.INVALID_RESTART_ANSWER);
    }
  },
  validatePrice(price) {
    this.validateNumber(price);
    this.validatePurchaseUnit(price);
  },
  validateWinningNums(winningNums) {
    winningNums.forEach((num) => this.validateNumber(num));
    this.validateLottoCount(winningNums);
    winningNums.forEach((num) => this.validateLottoNumRange(num));
    this.validateDuplicateLottoNums(winningNums);
  },
  validateBonusNum(winningNums, bonusNum) {
    this.validateNumber(bonusNum);
    this.validateLottoNumRange(bonusNum);
    this.validateDuplicateBonusNum(winningNums, bonusNum);
  }
};
class Lotto {
  #numbers;
  constructor(numbers) {
    this.#validate(numbers);
    this.#numbers = numbers;
  }
  #validate(numbers) {
    Validator.validateLottoCount(numbers);
    numbers.forEach((number) => Validator.validateLottoNumRange(number));
    Validator.validateDuplicateLottoNums(numbers);
  }
  getRank(winningLotto, bonusNum) {
    const matchCount = matchWinningCount([...this.#numbers], winningLotto);
    const hasBonus = matchBonus([...this.#numbers], bonusNum);
    const rank = calPrize(matchCount, hasBonus);
    return rank;
  }
  getNumbers() {
    return [...this.#numbers];
  }
}
function pickUniqueNumbersInRange(min, max, size) {
  const uniqueNumbers = /* @__PURE__ */ new Set();
  while (uniqueNumbers.size < size) {
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    uniqueNumbers.add(randomNum);
  }
  return Array.from(uniqueNumbers);
}
function makeLottos(amount) {
  return Array.from({ length: amount }, () => {
    const numbers = pickUniqueNumbersInRange(
      LOTTO_NUMBER_RANGE.MIN,
      LOTTO_NUMBER_RANGE.MAX,
      LOTTO_SIZE
    ).sort((a, b) => a - b);
    return new Lotto(numbers);
  });
}
class LottoController {
  #purchasedLottos;
  #rankCount;
  #totalPrize;
  issueLottos(lottoCount) {
    this.#purchasedLottos = makeLottos(lottoCount);
    return this.#purchasedLottos.map((lotto) => lotto.getNumbers());
  }
  updateWinningResult(winningLotto, bonusNum) {
    const rankCount = Array(6).fill(0);
    let totalPrize = 0;
    this.#purchasedLottos.forEach((lotto) => {
      const rank = lotto.getRank(winningLotto, bonusNum);
      rankCount[rank] += 1;
      totalPrize += PRIZE[rank];
    });
    this.#rankCount = rankCount;
    this.#totalPrize = totalPrize;
  }
  getWinningResult() {
    const purchasedPrice = this.#purchasedLottos.length * LOTTO_PRICE;
    return {
      rankCount: this.#rankCount,
      profitRate: calProfitRate(purchasedPrice, this.#totalPrize)
    };
  }
}
const LottoTicket = (lotto) => {
  const numbers = lotto.join(", ");
  return `
    <li class="lotto-ticket">
      <span class="lotto-icon">🎟️</span>
      <span class="lotto-numbers">${numbers}</span>
    </li>
  `;
};
const PurchaseView = {
  purchaseForm: document.querySelector("#purchase-form"),
  purchasePriceInput: document.querySelector("#purchase-price"),
  countText: document.querySelector("#lotto-count-text"),
  lottoList: document.querySelector("#lotto-list"),
  onPurchase(handler) {
    this.purchaseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const purchasedPrice = Number(this.purchasePriceInput.value);
      handler(purchasedPrice);
    });
  },
  renderPurchasedLottos(lottos) {
    this.countText.textContent = `총 ${lottos.length}개를 구매하였습니다.`;
    this.lottoList.innerHTML = lottos.map((lotto) => LottoTicket(lotto)).join("");
  },
  clearPurchasedLottos() {
    this.countText.textContent = "";
    this.lottoList.innerHTML = "";
  },
  clearPriceInput() {
    this.purchaseForm.reset();
  }
};
const NumberInput = (name, ariaLabel = "", id = "") => `
  <input 
    type="number" 
    name="${name}" 
    ${id ? `id="${id}"` : ""}
    ${ariaLabel ? `aria-label="${ariaLabel}"` : ""}
    class="number-input"
  />
`;
const WinningNumberInput = () => `
  <span class="input-label">당첨 번호</span>
  <div class="number-input-wrapper">
    ${Array.from(
  { length: 6 },
  (_, i) => NumberInput("winning-number", `당첨 번호 ${i + 1}번`)
).join("")}
  </div>
`;
const BonusNumberInput = () => `
  <label for="bonus-number" class="input-label">보너스 번호</label>
  <div class="number-input-wrapper">
    ${NumberInput("bonus-number", "보너스 번호", "bonus-number")}
  </div>
`;
const WinningInputView = {
  winningSection: document.querySelector("#winning-section"),
  winningForm: document.querySelector("#winning-form"),
  winningNumbersContainer: document.querySelector("#winning-numbers-container"),
  bonusNumberContainer: document.querySelector("#bonus-number-container"),
  limitInputLength() {
    this.winningSection.addEventListener("keydown", (e) => {
      if (!e.target.classList.contains("number-input")) return;
      const target = e.target;
      const allowKeys = ["Backspace", "Delete", "Tab"];
      if (target.value.length >= 2 && !allowKeys.includes(e.key) && !e.key.includes("Arrow")) {
        e.preventDefault();
      }
    });
  },
  onSubmitNumbers(handler) {
    this.winningForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(this.winningForm);
      const winningNumbers = formData.getAll("winning-number").map(Number);
      const bonusNumber = Number(formData.get("bonus-number"));
      handler(winningNumbers, bonusNumber);
    });
  },
  renderInput() {
    this.winningNumbersContainer.innerHTML = WinningNumberInput();
    this.bonusNumberContainer.innerHTML = BonusNumberInput();
    this.winningSection.classList.remove("hidden");
  },
  hideInput() {
    this.winningSection.classList.add("hidden");
  },
  clearInput() {
    this.winningForm.reset();
  }
};
const ResultRow = (condition, prize, count) => `
  <tr>
    <td >${condition}</td>
    <td >${prize.toLocaleString()}</td>
    <td >${count}개</td>
  </tr>
`;
const LottoResultView = {
  resultModal: document.querySelector("#result-modal"),
  tbody: document.querySelector("#result-tbody"),
  profitText: document.querySelector("#profit-text"),
  closeBtn: document.querySelector("#modal-close-btn"),
  restartBtn: document.querySelector("#restart-btn"),
  onClose() {
    this.closeBtn.addEventListener("click", () => {
      this.resultModal.close();
    });
  },
  onRestart(handler) {
    this.restartBtn.addEventListener("click", () => {
      handler();
      this.resultModal.close();
    });
  },
  renderResult(rankCount, profitRate) {
    const ranks = [5, 4, 3, 2, 1];
    this.tbody.innerHTML = ranks.map((rank) => ResultRow(CONDITION[rank], PRIZE[rank], rankCount[rank])).join("");
    const profitRateStr = profitRate.toLocaleString("ko-KR", {
      maximumFractionDigits: 1
    });
    this.profitText.textContent = `당신의 총 수익률은 ${profitRateStr}%입니다.`;
    this.resultModal.showModal();
  }
};
class WebApp {
  #lottoController;
  constructor() {
    this.#lottoController = new LottoController();
  }
  bindEvents() {
    PurchaseView.onPurchase((price) => this.#handlePurchase(price));
    WinningInputView.limitInputLength();
    WinningInputView.onSubmitNumbers(
      (winningNumbers, bonusNumber) => this.#handleWinningResult(winningNumbers, bonusNumber)
    );
    LottoResultView.onClose();
    LottoResultView.onRestart(() => this.#restartGame());
  }
  #handlePurchase(purchasedPrice) {
    try {
      Validator.validatePrice(purchasedPrice);
      const lottoCount = purchasedPrice / LOTTO_PRICE;
      const purchasedLottos = this.#lottoController.issueLottos(lottoCount);
      PurchaseView.renderPurchasedLottos(purchasedLottos);
      WinningInputView.renderInput();
      PurchaseView.clearPriceInput();
    } catch (error) {
      alert(error.message);
    }
  }
  #handleWinningResult(winningNumbers, bonusNumber) {
    try {
      Validator.validateWinningNums(winningNumbers);
      Validator.validateBonusNum(winningNumbers, bonusNumber);
      this.#lottoController.updateWinningResult(winningNumbers, bonusNumber);
      const { rankCount, profitRate } = this.#lottoController.getWinningResult();
      LottoResultView.renderResult(rankCount, profitRate);
    } catch (error) {
      alert(error.message);
    }
  }
  #restartGame() {
    PurchaseView.clearPurchasedLottos();
    WinningInputView.clearInput();
    WinningInputView.hideInput();
  }
}
window.addEventListener("DOMContentLoaded", () => {
  const webApp = new WebApp();
  webApp.bindEvents();
});
