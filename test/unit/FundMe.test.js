const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");

const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.parseEther("1");

          beforeEach(async function () {
              const accounts = await ethers.getSigners();
              signer = accounts[0];
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);

              const fundMeDeployment = await deployments.get("FundMe");
              fundMe = await ethers.getContractAt(
                  fundMeDeployment.abi,
                  fundMeDeployment.address,
                  signer
              );
              const mockV3AggregatorDeployment = await deployments.get(
                  "MockV3Aggregator"
              );
              mockV3Aggregator = await ethers.getContractAt(
                  mockV3AggregatorDeployment.abi,
                  mockV3AggregatorDeployment.address,
                  signer
              );
              // mockV3Aggregator = await ethers.getContractAt('MockV3Aggregator', deployer);
          });

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.target);
              });
          });

          describe("fund", function () {
              it("fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enoough"
                  );
              });
              it("updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      signer.address
                  );
                  assert.equal(response.toString(), sendValue);
              });
              it("adds funder to array of s_funders", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, signer.address);
              });
          });

          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraws ETH from a single funder", async function () {
                  // Arrange
                  const address = await fundMe.getAddress();
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      );
                  const startingdeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      (
                          startingFundMeBalance + startingdeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  );
              });

              it("allows us to withdraw with multiple s_funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners();
                  for (let i; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      );
                  const startingdeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      (
                          startingFundMeBalance + startingdeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  );

                  // Make sure that the s_funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it("only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("Sender is not owner!");
              });

              it("cheaply withdraws ETH from a single funder", async function () {
                  // Arrange
                  const address = await fundMe.getAddress();
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      );
                  const startingdeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      (
                          startingFundMeBalance + startingdeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  );
              });

              it("cheaper withdraw...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners();
                  for (let i; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      );
                  const startingdeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      (
                          startingFundMeBalance + startingdeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  );

                  // Make sure that the s_funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });
          });
      });
