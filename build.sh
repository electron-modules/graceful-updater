# 1. clean build
rm -rf ./build

# 2. tsc compile 
`npm bin`/ttsc -p tsconfig.json

# 3. copy libs 
cp -Rv ./src/libs/ ./build/libs
