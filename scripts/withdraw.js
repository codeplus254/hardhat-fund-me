const { deployments, getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const accounts = await ethers.getSigners();
    signer = accounts[0];
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);

    const fundMeDeployment = await deployments.get("FundMe");

    const fundMe = await ethers.getContractAt(
        fundMeDeployment.abi,
        fundMeDeployment.address,
        signer
    );
    console.log("Funding contract...");
    const transactionResponse = await fundMe.withdraw();
    await transactionResponse.wait(1);
    console.log("Got it back...");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
