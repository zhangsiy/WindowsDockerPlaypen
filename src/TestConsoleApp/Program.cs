using System;
using System.Threading;

namespace TestConsoleApp
{
    class Program
    {
        static void Main(string[] args)
        {
            while (!Console.KeyAvailable)
            {
                Console.WriteLine("Hello World!");
                Thread.Sleep(2000);
            }
        }
    }
}