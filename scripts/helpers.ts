import chalk from 'chalk';

export const info = (message: string) => console.log(chalk.dim(message));
export const success = (message: string) => console.log(chalk.green(message));
