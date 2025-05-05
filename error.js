export const error = {
    invalid: (withSign = false) => {
        process.stderr.write(`> Invalid input ${withSign ? '\n> ' : '\n'}`);
    },
    failed: () => {
        process.stderr.write("> Operation failed \n> ");
    },
}