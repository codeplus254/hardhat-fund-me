const { getNamedAccounts, ethers, network } = require("hardhat");
const { assert } = require("chai");

const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          const sendValue = ethers.parseEther("1");

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);

              const fundMeDeployment = await deployments.get("FundMe");
              fundMe = await ethers.getContractAt(
                  fundMeDeployment.abi,
                  fundMeDeployment.address,
                  signer
              );
          });

          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();

              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.equal(endingBalance.toString(), "0");
          });
      });
